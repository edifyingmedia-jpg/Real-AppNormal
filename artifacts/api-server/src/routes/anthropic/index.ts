import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, conversations as conversationsTable, messages as messagesTable, projectsTable, projectFilesTable } from "@workspace/db";
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

const FREE_TIER_LIMIT = 500_000;
const LOW_CREDITS_THRESHOLD = 0.15;

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
    .values({ ...parsed.data, creditLimit: FREE_TIER_LIMIT })
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

  // Credit check before generation
  const creditLimit = conversation.creditLimit ?? FREE_TIER_LIMIT;
  const tokensUsed = conversation.tokensUsed ?? 0;
  const tokensRemaining = creditLimit - tokensUsed;
  const usagePercentage = tokensUsed / creditLimit;

  if (tokensRemaining <= 0) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const credits = { used: tokensUsed, limit: creditLimit, remaining: 0, percentage: 100 };
    res.write(`data: ${JSON.stringify({ error: "CREDITS_EXHAUSTED", credits, message: "You've used all your free credits. Upgrade to AppNormal Pro to keep building." })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    return;
  }

  // Look up the project linked to this conversation for integration settings + current files
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.conversationId, conversationId));

  // Fetch current project files for context-aware editing
  let currentFiles: { filename: string; content: string; language: string }[] = [];
  if (project) {
    currentFiles = await db
      .select({
        filename: projectFilesTable.filename,
        content: projectFilesTable.content,
        language: projectFilesTable.language,
      })
      .from(projectFilesTable)
      .where(eq(projectFilesTable.projectId, project.id));
  }

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

  // Inject current files into the last user message so Claude can modify them
  if (currentFiles.length > 0) {
    const fileContext = currentFiles
      .map((f) => `\`\`\`${f.language} [${f.filename}]\n${f.content}\n\`\`\``)
      .join("\n\n");
    chatMessages[chatMessages.length - 1] = {
      role: "user",
      content: `[CURRENT PROJECT FILES — modify these, don't start from scratch unless the user explicitly asks to rebuild]\n\n${fileContext}\n\n[USER REQUEST]\n${userContent}`,
    };
  }

  // Build integration context
  let integrationContext = "";

  if (project?.supabaseUrl && project?.supabaseAnonKey) {
    integrationContext += `

=== SUPABASE INTEGRATION ===
Supabase URL: ${project.supabaseUrl}
Anon Key: ${project.supabaseAnonKey}

Include Supabase via CDN:
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

Initialize:
const { createClient } = supabase
const sb = createClient('${project.supabaseUrl}', '${project.supabaseAnonKey}')

Auth patterns:
  // Sign up
  const { data, error } = await sb.auth.signUp({ email, password })
  // Sign in
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  // Sign out
  await sb.auth.signOut()
  // Get session
  const { data: { user } } = await sb.auth.getUser()
  // Listen to auth changes
  sb.auth.onAuthStateChange((event, session) => { ... })
  // OAuth (Google, GitHub, etc.)
  await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } })

Database patterns (always handle errors):
  // Select
  const { data, error } = await sb.from('table').select('*').order('created_at', { ascending: false })
  // Select with filter
  const { data } = await sb.from('todos').select().eq('user_id', user.id)
  // Insert
  const { data, error } = await sb.from('table').insert({ col: val }).select().single()
  // Update
  const { error } = await sb.from('table').update({ col: val }).eq('id', id)
  // Delete
  const { error } = await sb.from('table').delete().eq('id', id)
  // Realtime subscription
  const channel = sb.channel('changes').on('postgres_changes',
    { event: '*', schema: 'public', table: 'messages' },
    (payload) => console.log(payload)
  ).subscribe()

Storage patterns:
  const { data } = await sb.storage.from('bucket').upload(path, file)
  const { data: { publicUrl } } = sb.storage.from('bucket').getPublicUrl(path)

IMPORTANT: Always implement full auth flow (sign up / sign in / sign out), protect routes, and handle auth state persistently using onAuthStateChange.`;
  }

  if (project?.stripePublishableKey) {
    integrationContext += `

=== STRIPE INTEGRATION ===
Publishable Key: ${project.stripePublishableKey}

Include Stripe.js via CDN:
<script src="https://js.stripe.com/v3/"></script>

Initialize:
const stripe = Stripe('${project.stripePublishableKey}')

Payment Element (recommended — handles all payment methods):
  const elements = stripe.elements({ mode: 'payment', amount: 2000, currency: 'usd' })
  const paymentElement = elements.create('payment')
  paymentElement.mount('#payment-element')
  // Confirm payment
  const { error } = await stripe.confirmPayment({ elements, confirmParams: { return_url: window.location.href } })

Card Element (simple card input):
  const elements = stripe.elements()
  const card = elements.create('card', { style: { base: { fontSize: '16px' } } })
  card.mount('#card-element')
  // Create token
  const { token, error } = await stripe.createToken(card)

Pricing display: show prices in the UI before payment. Use realistic amounts.
NOTE: Actual payment requires a backend for PaymentIntents. Show the UI with a note that backend integration is needed for real charges, OR use Supabase Edge Functions when Supabase is configured.`;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  const isFirstBuild = currentFiles.length === 0;

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 32768,
    system: buildSystemPrompt(isFirstBuild, integrationContext),
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
  const usage = finalMsg.usage;
  const messageTokens = (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0);

  // Store message with token counts
  await db.insert(messagesTable).values({
    conversationId,
    role: "assistant",
    content: fullResponse,
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
  });

  // Update conversation token usage
  await db
    .update(conversationsTable)
    .set({ tokensUsed: sql`${conversationsTable.tokensUsed} + ${messageTokens}` })
    .where(eq(conversationsTable.id, conversationId));

  const newTokensUsed = tokensUsed + messageTokens;
  const newRemaining = Math.max(0, creditLimit - newTokensUsed);
  const newPercentage = Math.round((newTokensUsed / creditLimit) * 100);
  const credits = {
    used: newTokensUsed,
    limit: creditLimit,
    remaining: newRemaining,
    percentage: newPercentage,
  };

  if (wasTruncated) {
    res.write(`data: ${JSON.stringify({ error: "TRUNCATED", message: "Response was cut short — the app was too large. Try asking for a simpler version, or break your request into smaller steps." })}\n\n`);
  }

  // Send credit update event
  res.write(`data: ${JSON.stringify({ credits })}\n\n`);

  // Warn if credits are getting low
  if (newRemaining > 0 && newRemaining / creditLimit <= LOW_CREDITS_THRESHOLD) {
    res.write(`data: ${JSON.stringify({ warning: "LOW_CREDITS", credits, message: `You have ${Math.round(newRemaining / 1000)}k tokens remaining (${100 - newPercentage}%). Upgrade to AppNormal Pro for unlimited builds.` })}\n\n`);
  }

  if (newRemaining <= 0) {
    res.write(`data: ${JSON.stringify({ error: "CREDITS_EXHAUSTED", credits, message: "You've used all your free credits. Upgrade to AppNormal Pro to keep building." })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

function buildSystemPrompt(isFirstBuild: boolean, integrationContext: string): string {
  const editingGuidance = isFirstBuild
    ? `You are creating a brand new app. Build it complete and polished from the ground up.`
    : `You are EDITING an existing app. The user's current files are shown in the message prefixed with [CURRENT PROJECT FILES].
- Make TARGETED changes: only modify what the user asked for
- Preserve all existing functionality that isn't mentioned
- Return ALL files (including unchanged ones) so the full app is always in sync
- If the change is small (e.g. fix a bug, change a color), return the minimal set of files that changed
- If the change is structural (new feature, redesign), return all files`;

  return `You are AppNormal — an expert full-stack AI engineer on par with the best engineers at Replit and Bolt.new. You build complete, beautiful, production-quality web applications.

${editingGuidance}

CRITICAL OUTPUT FORMAT: Respond ONLY with a raw JSON object. No markdown, no code fences, no backticks, no explanation outside the JSON. The entire response must be parseable JSON.

Required format:
{
  "explanation": "2-3 sentence summary of what you built or changed, and key technologies used",
  "files": [
    {
      "filename": "index.html",
      "language": "html",
      "content": "FULL file content — never truncate"
    }
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHITECTURE GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEFAULT: Single self-contained index.html
  - All CSS in a <style> tag
  - All JS in a <script> tag before </body>
  - No external file references
  - Works completely standalone in a browser

MULTI-FILE (for complex apps ≥ 200 lines of JS/CSS):
  - index.html references style.css and script.js
  - Include ALL three files in the response
  - Never reference a file not in the files array

REACT APPS (when user asks for React or a complex SPA):
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  Then: <script type="text/babel"> for JSX
  Use hooks: useState, useEffect, useCallback, useMemo, useRef, useContext
  React Router via CDN for multi-page: <script src="https://unpkg.com/react-router-dom@6/umd/react-router-dom.development.js"></script>

TAILWIND CSS (use when building modern UIs):
  <script src="https://cdn.tailwindcss.com"></script>
  Optionally configure: <script>tailwind.config = { theme: { extend: {} } }</script>

CHART.JS / DATA VIZ:
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

THREE.JS (3D):
  <script src="https://unpkg.com/three@0.158.0/build/three.min.js"></script>

FRAMER MOTION / ANIMATION:
  Use CSS animations and transitions — no bundler available.
  For complex animations: <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>

ICONS:
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  Then: lucide.createIcons()
  Or: <i data-lucide="icon-name"></i>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FULL-STACK PATTERNS (when Supabase is configured)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When building apps with Supabase, think like a senior full-stack engineer:

DATABASE SCHEMA DESIGN: Create proper table structures with:
  - id (uuid, default gen_random_uuid())
  - user_id (uuid, references auth.users) for user-owned data
  - created_at (timestamptz, default now())
  - Appropriate indexes and constraints

AUTHENTICATION FLOW:
  1. Show login/signup form to unauthenticated users
  2. Use sb.auth.onAuthStateChange() to reactively update UI
  3. Persist login state with Supabase's built-in session management
  4. Show user email/avatar in nav when logged in
  5. Provide sign-out button

REAL-TIME APPS:
  - Use Supabase Realtime for live updates (chat, collaboration, dashboards)
  - Always clean up subscriptions: channel.unsubscribe()

ROW LEVEL SECURITY NOTE:
  - Tell the user to enable RLS on their tables in Supabase Dashboard
  - Include commented policy examples in the code

${integrationContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CODE QUALITY STANDARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VISUAL DESIGN — be a designer, not just a programmer:
  - Modern, polished UI: proper whitespace, consistent spacing scale (4px base)
  - Beautiful typography: system font stack or Google Fonts via CDN
  - Color palette: pick 1-2 primary colors, use tints/shades consistently
  - CSS custom properties for theming: --color-primary, --spacing-sm, etc.
  - Micro-interactions: hover transitions (150ms ease), focus rings, button press
  - Loading skeletons, not just "Loading..." text
  - Empty states with illustrations or helpful copy
  - Error states with clear recovery actions
  - Mobile-first responsive design: works perfectly at 320px and 1440px

FUNCTIONAL COMPLETENESS — ship working software:
  - Every button does something
  - Forms validate input before submission (required fields, email format, etc.)
  - API calls have loading/error/success states
  - Local storage for persistence when Supabase isn't configured
  - No TODOs, no placeholder content, no "coming soon" sections
  - Edge cases handled: empty lists, long text, network errors

CODE CRAFT:
  - Compact, efficient code — avoid excessive comments and whitespace
  - Descriptive variable names
  - DRY — extract repeated patterns into functions
  - No console.log spam
  - No inline event handlers in HTML (use addEventListener)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARD RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✗ NEVER output markdown code blocks — only raw JSON
✗ NEVER use Node.js/Express/server-side code — output runs in a browser
✗ NEVER reference a file in HTML that isn't in your files array
✗ NEVER truncate code with "// ... rest of code" — always write it fully
✗ NEVER use import/export ES modules (no bundler available)
✗ NEVER use Lorem ipsum or fake placeholder data — use realistic content
✗ NEVER leave broken links, empty href="#", or non-functional buttons`;
}

export default router;
