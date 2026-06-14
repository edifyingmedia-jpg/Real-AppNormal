import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, conversations as conversationsTable, messages as messagesTable, projectsTable } from "@workspace/db";
import {
  CreateAnthropicConversationBody,
  GetAnthropicConversationParams,
  DeleteAnthropicConversationParams,
  ListAnthropicMessagesParams,
  SendAnthropicMessageParams,
  SendAnthropicMessageBody,
} from "@workspace/api-zod";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();

router.get("/anthropic/conversations", async (_req, res): Promise<void> => {
  const conversations = await db
    .select()
    .from(conversationsTable)
    .orderBy(conversationsTable.createdAt);
  res.json(conversations);
});

router.post("/anthropic/conversations", async (req, res): Promise<void> => {
  const parsed = CreateAnthropicConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [conversation] = await db
    .insert(conversationsTable)
    .values(parsed.data)
    .returning();
  res.status(201).json(conversation);
});

router.get("/anthropic/conversations/:id", async (req, res): Promise<void> => {
  const params = GetAnthropicConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id));
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);
  res.json({ ...conversation, messages });
});

router.delete("/anthropic/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteAnthropicConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(messagesTable).where(eq(messagesTable.conversationId, params.data.id));
  const [conversation] = await db
    .delete(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id))
    .returning();
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/anthropic/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = ListAnthropicMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);
  res.json(messages);
});

router.post("/anthropic/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendAnthropicMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = SendAnthropicMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const conversationId = params.data.id;
  const userContent = parsed.data.content;

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, conversationId));
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Look up the project linked to this conversation to get integration settings
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.conversationId, conversationId));

  await db.insert(messagesTable).values({
    conversationId,
    role: "user",
    content: userContent,
  });

  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(messagesTable.createdAt);

  const chatMessages = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Build integration context sections
  let integrationContext = "";

  if (project?.supabaseUrl && project?.supabaseAnonKey) {
    integrationContext += `

=== SUPABASE INTEGRATION (ACTIVE) ===
This project is connected to Supabase. Use these credentials in generated code:
- Supabase URL: ${project.supabaseUrl}
- Supabase Anon Key: ${project.supabaseAnonKey}

Include Supabase via CDN in index.html:
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

Initialize in your script:
const { createClient } = supabase
const supabaseClient = createClient('${project.supabaseUrl}', '${project.supabaseAnonKey}')

Available Supabase features to use:
- Auth: supabaseClient.auth.signUp(), .signInWithPassword(), .signOut(), .getUser()
- Database: supabaseClient.from('table').select(), .insert(), .update(), .delete(), .upsert()
- Realtime: supabaseClient.channel('name').on('postgres_changes', ...).subscribe()
- Storage: supabaseClient.storage.from('bucket').upload(), .download(), .getPublicUrl()

Build real full-stack features: user authentication, persistent data storage, realtime updates.
Always handle auth state and show appropriate UI for logged-in vs logged-out users.`;
  }

  if (project?.stripePublishableKey) {
    integrationContext += `

=== STRIPE INTEGRATION (ACTIVE) ===
This project uses Stripe for payments. Use this publishable key: ${project.stripePublishableKey}

Include Stripe.js via CDN in index.html:
<script src="https://js.stripe.com/v3/"></script>

Initialize in your script:
const stripe = Stripe('${project.stripePublishableKey}')

For payment UI, use Stripe Elements:
const elements = stripe.elements()
const cardElement = elements.create('card')
cardElement.mount('#card-element')

Note: Stripe requires a backend for payment intents. When Supabase is also configured,
you can use Supabase Edge Functions as the backend for Stripe webhooks and payment intents.
For frontend-only demos, you can show the payment UI without completing real charges.`;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 32768,
    system: `You are an expert full-stack web developer AI, similar to Lovable or Bolt. You build complete, beautiful, fully-functional web applications from a user's description.

CRITICAL: You MUST respond with ONLY a raw JSON object — no markdown, no code fences, no backticks, no explanation outside the JSON. The entire response must be valid JSON.

Required response format:
{
  "explanation": "2-3 sentence summary of what you built and the key technologies used",
  "files": [
    {
      "filename": "index.html",
      "language": "html",
      "content": "FULL file content here"
    }
  ]
}

IMPORTANT: Keep apps self-contained in a single index.html file whenever possible. Only use multiple files for genuinely complex apps. Avoid excessive comments or whitespace — write compact, efficient code to stay within output limits.

=== ARCHITECTURE RULES ===

**Self-contained apps (default):**
Put ALL CSS inline in a <style> tag inside index.html, and ALL JavaScript inline in a <script> tag before </body>. Do NOT reference external files like style.css or script.js. A single index.html file that works completely standalone.

**Multi-file apps (when app is complex enough to warrant separation):**
- index.html: references style.css via <link> and script.js via <script src>
- style.css: all styles
- script.js: all JavaScript
- When multi-file, include ALL three files in the "files" array

**React apps (when user asks for React or a complex SPA):**
Use React via CDN in index.html — self-contained single file:
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
Then use <script type="text/babel"> for JSX components.

**Tailwind CSS:**
Include via CDN when appropriate:
<script src="https://cdn.tailwindcss.com"></script>

**Chart.js, D3, Three.js, etc.:**
Include via CDN: <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
${integrationContext}

=== QUALITY RULES ===

- Make it PRODUCTION-QUALITY visually: modern design, good typography, proper spacing
- Use CSS custom properties for theming
- Add micro-interactions and transitions (hover effects, smooth animations)
- Make it fully responsive (mobile + desktop)
- Include loading states and error handling where appropriate
- No placeholder text like "Lorem ipsum" — use realistic content
- No TODOs or incomplete sections — ship the whole thing
- Dark mode support is a bonus but not required
- The app must actually WORK end-to-end, not just look good

=== WHAT NOT TO DO ===
- NEVER use Node.js/Express/server code — output runs in a browser iframe
- NEVER reference a file in HTML that isn't in your files array
- NEVER output markdown code blocks, only raw JSON
- NEVER truncate code with "// ... rest of code" — always write it fully
- NEVER use import/export ES modules (no bundler available)`,
    messages: chatMessages,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullResponse += event.delta.text;
      res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
    }
  }

  const finalMsg = await stream.finalMessage();
  const wasTruncated = finalMsg.stop_reason === "max_tokens";

  await db.insert(messagesTable).values({
    conversationId,
    role: "assistant",
    content: fullResponse,
  });

  if (wasTruncated) {
    res.write(`data: ${JSON.stringify({ error: "Response was too long and got cut off. Try asking for a simpler or smaller app, or break the request into smaller steps." })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
