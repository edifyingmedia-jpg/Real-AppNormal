import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, conversations as conversationsTable, messages as messagesTable, projectsTable, projectFilesTable, usersTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  CreateAnthropicConversationBody,
  GetAnthropicConversationParams,
  DeleteAnthropicConversationParams,
  ListAnthropicMessagesParams,
  SendAnthropicMessageParams,
  SendAnthropicMessageBody,
} from "@workspace/api-zod";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

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

  // User-level credit check (takes priority over conversation-level)
  const auth = getAuth(req);
  const userId = auth?.userId ?? null;
  let userCreditsRemaining: number | null = null;

  if (userId) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (user) {
      userCreditsRemaining = user.creditsRemaining;
      if (user.creditsRemaining <= 0) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.write(`data: ${JSON.stringify({ error: "CREDITS_EXHAUSTED", message: "You've used all your credits. Upgrade your plan or purchase a credit bundle to keep building.", tier: user.tier })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }
    }
  }

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

  const projectOpenaiKey = project?.openaiApiKey ?? process.env.OPENAI_API_KEY;
  const projectGeminiKey = project?.geminiApiKey ?? process.env.GEMINI_API_KEY;

  if (projectOpenaiKey) {
    integrationContext += `

=== OPENAI INTEGRATION ===
API Key: ${projectOpenaiKey}

Include OpenAI via CDN:
<script type="module">
  // Use fetch to call the OpenAI REST API directly (CDN doesn't have an official browser SDK)
  // Always use HTTPS, never expose secret keys in production client code (this is a dev prototype)
</script>

Pattern for calling OpenAI REST API from a browser app:
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${projectOpenaiKey}',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: userMessage }],
      stream: false,
    }),
  })
  const data = await response.json()
  const reply = data.choices[0].message.content

Pattern for streaming responses:
  // Set stream: true and read response.body as a ReadableStream
  // Parse SSE data lines and extract delta.content from each chunk

Use this key whenever the app needs AI text generation, chat, or completion features.`;
  }

  if (projectGeminiKey) {
    integrationContext += `

=== GOOGLE GEMINI INTEGRATION ===
API Key: ${projectGeminiKey}

Call Gemini via REST API from browser:
  const response = await fetch(
    \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${projectGeminiKey}\`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }],
      }),
    }
  )
  const data = await response.json()
  const reply = data.candidates[0].content.parts[0].text

Use this key whenever the app needs AI text generation, chat, or completion features via Gemini.`;
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
  const systemPrompt = buildSystemPrompt(isFirstBuild, integrationContext, userCreditsRemaining);
  const aiModel = project?.aiModel ?? "claude-opus-4-5";

  let messageTokens = 0;
  let wasTruncated = false;

  if (aiModel === "gpt-4.1") {
    const openaiKey = project?.openaiApiKey ?? process.env.OPENAI_API_KEY;
    const openaiClient = new OpenAI({ apiKey: openaiKey });
    const gptMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...chatMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];
    const gptStream = await openaiClient.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 32000,
      messages: gptMessages,
      stream: true,
      stream_options: { include_usage: true },
    });
    for await (const chunk of gptStream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      if (chunk.usage) {
        messageTokens = (chunk.usage.prompt_tokens ?? 0) + (chunk.usage.completion_tokens ?? 0);
      }
      if (chunk.choices[0]?.finish_reason === "length") wasTruncated = true;
    }
  } else if (aiModel === "gemini-2.5-flash") {
    const geminiKey = project?.geminiApiKey ?? process.env.GEMINI_API_KEY;
    const geminiClient = new GoogleGenAI({ apiKey: geminiKey! });
    const geminiMessages = chatMessages.map((m) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.content }],
    }));
    const geminiStream = await geminiClient.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: geminiMessages,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 32000,
      },
    });
    for await (const chunk of geminiStream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
      if (chunk.usageMetadata) {
        messageTokens = (chunk.usageMetadata.promptTokenCount ?? 0) + (chunk.usageMetadata.candidatesTokenCount ?? 0);
      }
    }
  } else {
    // Default: Claude (Anthropic)
    const stream = anthropic.messages.stream({
      model: "claude-opus-4-5",
      max_tokens: 32000,
      system: systemPrompt,
      messages: chatMessages,
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullResponse += event.delta.text;
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }
    const finalMsg = await stream.finalMessage();
    wasTruncated = finalMsg.stop_reason === "max_tokens";
    const usage = finalMsg.usage;
    messageTokens = (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0);
  }

  // Store assistant message (all providers)
  await db.insert(messagesTable).values({
    conversationId,
    role: "assistant",
    content: fullResponse,
    inputTokens: 0,
    outputTokens: messageTokens,
  });

  // Update conversation token usage
  await db
    .update(conversationsTable)
    .set({ tokensUsed: sql`${conversationsTable.tokensUsed} + ${messageTokens}` })
    .where(eq(conversationsTable.id, conversationId));

  // Deduct user-level credits (1 credit = 50,000 tokens)
  if (userId && messageTokens > 0) {
    const creditsToDeduct = Math.max(1, Math.ceil(messageTokens / 50_000));
    await db
      .update(usersTable)
      .set({ creditsRemaining: sql`GREATEST(0, ${usersTable.creditsRemaining} - ${creditsToDeduct})` })
      .where(eq(usersTable.id, userId));
    if (userCreditsRemaining !== null) {
      userCreditsRemaining = Math.max(0, userCreditsRemaining - creditsToDeduct);
    }
  }

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

  res.write(`data: ${JSON.stringify({ credits })}\n\n`);

  if (newRemaining > 0 && newRemaining / creditLimit <= LOW_CREDITS_THRESHOLD) {
    res.write(`data: ${JSON.stringify({ warning: "LOW_CREDITS", credits, message: `You have ${Math.round(newRemaining / 1000)}k tokens remaining (${100 - newPercentage}%). Upgrade to AppNormal Pro for unlimited builds.` })}\n\n`);
  }

  if (newRemaining <= 0) {
    res.write(`data: ${JSON.stringify({ error: "CREDITS_EXHAUSTED", credits, message: "You've used all your free credits. Upgrade to AppNormal Pro to keep building." })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

function buildSystemPrompt(isFirstBuild: boolean, integrationContext: string, userCreditsRemaining: number | null = null): string {
  const editingGuidance = isFirstBuild
    ? `You are creating a brand new app. Build it complete and fully functional from the ground up — not a skeleton, the real thing.`
    : `You are EDITING an existing app. The user's current files are in the message under [CURRENT PROJECT FILES].
- Make TARGETED changes: modify only what's needed for the request
- Preserve all existing functionality not mentioned
- Return ALL files (including unchanged ones) so the full app stays in sync
- For small changes (bug fix, color tweak): only return changed files
- For structural changes (new feature, redesign): return all files`;

  const creditContext = userCreditsRemaining !== null
    ? `\nUSER CREDITS: ${userCreditsRemaining} credits remaining (1 credit ≈ 50,000 tokens). Generate complete, working code efficiently.\n`
    : "";

  return `You are AppNormal — an elite full-stack engineer and product designer. You produce complete, sophisticated, production-quality web applications that rival what senior teams ship. You don't make demos — you make real software.
${creditContext}
${editingGuidance}

OUTPUT FORMAT — CRITICAL:
Respond ONLY with a raw JSON object. No markdown, no code fences, no backticks, no text outside the JSON. The full response must be valid JSON.

{
  "explanation": "2-3 sentences: what you built, key architecture decisions, and main technologies used",
  "files": [
    { "filename": "index.html", "language": "html", "content": "COMPLETE file — never truncate or summarize" }
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY SELF-REVIEW — RUN THIS BEFORE EVERY RESPONSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After writing code, mentally run through this checklist. If you find any issue — FIX IT before returning. Never return code you know is broken.

JAVASCRIPT REVIEW:
✓ No unclosed brackets, braces, or parentheses — count them if unsure
✓ Every function that is CALLED is also DEFINED (no missing helpers)
✓ Every variable is declared before use — no reference errors
✓ All DOM element IDs referenced in JS exist in the HTML (getElementById, querySelector)
✓ CDN scripts are loaded BEFORE code that uses them (script order matters)
✓ Array.map/filter/forEach only used on arrays, not null/undefined
✓ JSON.parse, localStorage, and fetch calls are wrapped in try-catch
✓ Async functions are awaited; Promises not left floating
✓ Event listeners are attached AFTER DOMContentLoaded or at bottom of <body>
✓ No typos in variable/function names — usage matches declaration exactly

CSS REVIEW:
✓ No unclosed braces — one { must have one }
✓ Custom properties (--var) that are used are also defined in :root or a parent
✓ Flexbox containers have display:flex; grid containers have display:grid

HTML REVIEW:
✓ All CDN <link> and <script> tags have valid, current URLs
✓ Form elements have matching name/id attributes if referenced by JS
✓ All opened tags are closed

COMMON BUGS TO PREVENT:
✗ Using const inside if-blocks then referencing outside (block scoping)
✗ Mutating state directly instead of via setState / reassignment
✗ Chart.js: calling new Chart() before canvas element exists in DOM
✗ SortableJS: calling Sortable.create() before elements are rendered
✗ GSAP/Anime.js: animating elements before they exist in DOM

WHEN FIXING USER-REPORTED ERRORS:
- Read the FULL codebase before making any changes
- Fix the reported error AND scan for ALL related bugs
- If a variable name is wrong, check every usage site
- Return ALL files with all fixes applied — not just the changed ones

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHITECTURE DECISION GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pick the right architecture for the app's complexity:

① VANILLA JS (default — simple to medium apps)
  Single index.html with inline <style> and <script>
  Use the Module Pattern for organization:
    const App = (() => {
      // Private state
      let state = { items: [], filter: 'all' }
      // Pub/sub for decoupled updates
      const events = {}
      const on = (e, fn) => (events[e] = events[e] || []).push(fn)
      const emit = (e, data) => (events[e] || []).forEach(fn => fn(data))
      // Single render function with DOM diffing concept
      const render = () => { /* update only what changed */ }
      return { init, on }
    })()
  Use localStorage for persistence. Use fetch() for APIs.

② REACT (complex SPAs, dashboards, apps with many interactive states)
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  Write JSX in <script type="text/babel">
  
  State management for complex apps — use useReducer + Context:
    const AppContext = React.createContext()
    function reducer(state, action) {
      switch(action.type) {
        case 'ADD_ITEM': return { ...state, items: [...state.items, action.payload] }
        case 'SET_FILTER': return { ...state, filter: action.payload }
        default: return state
      }
    }
    function AppProvider({ children }) {
      const [state, dispatch] = React.useReducer(reducer, initialState)
      return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
    }
  
  Routing (multi-page SPAs):
    <script src="https://unpkg.com/react-router-dom@6/umd/react-router-dom.development.js"></script>
    const { HashRouter, Routes, Route, Link, useNavigate, useParams } = ReactRouterDOM
    // Use HashRouter (not BrowserRouter) — no server config needed
  
  Custom hooks pattern:
    function useLocalStorage(key, defaultValue) {
      const [value, setValue] = React.useState(() => {
        try { return JSON.parse(localStorage.getItem(key)) ?? defaultValue }
        catch { return defaultValue }
      })
      React.useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value])
      return [value, setValue]
    }

③ MULTI-FILE (large apps where separation helps readability)
  index.html references style.css and script.js
  Include ALL referenced files in the files array

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLETE CDN LIBRARY CATALOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UI & STYLING:
  Tailwind CSS:     <script src="https://cdn.tailwindcss.com"></script>
  Animate.css:      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
  Google Fonts:     <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

ICONS:
  Lucide:           <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>  → lucide.createIcons() / <i data-lucide="name">
  Font Awesome:     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  Heroicons:        use inline SVG

DATA VISUALIZATION:
  Chart.js:         <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    → new Chart(canvas, { type: 'bar'|'line'|'pie'|'doughnut'|'radar'|'scatter', data: {...}, options: {...} })
    → Chart.js 4 patterns: responsive:true, maintainAspectRatio:false, animation configs
  D3.js:            <script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
    → d3.select(), d3.scaleLinear(), d3.axisBottom(), d3.line(), d3.pie(), d3.arc()
    → d3.csv(), d3.json() for data loading
  ApexCharts:       <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
    → var chart = new ApexCharts(el, options); chart.render()

TABLES:
  DataTables:       <script src="https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js"></script>
  AG Grid (free):   <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>

MAPS:
  Leaflet.js:       <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
                    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    → L.map('id').setView([lat,lng], zoom); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
    → L.marker([lat,lng]).addTo(map).bindPopup('text')

DATES:
  Day.js:           <script src="https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js"></script>
    → dayjs().format('YYYY-MM-DD'); dayjs().subtract(7,'day'); dayjs().fromNow()

ANIMATIONS & 3D:
  GSAP:             <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
    → gsap.to('.el', { x:100, duration:0.5, ease:'power2.out' }); gsap.timeline()
  Three.js:         <script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>
  Anime.js:         <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>

RICH TEXT / MARKDOWN:
  Marked.js:        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>  → marked.parse(markdown)
  highlight.js:     <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  Quill:            Rich text editor — <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css">
                    <script src="https://cdn.quilljs.com/1.3.6/quill.min.js"></script>
                    → new Quill('#editor', { theme: 'snow', modules: { toolbar: [...] } })
  CodeMirror:       <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
                    → CodeMirror(el, { mode:'javascript', theme:'dracula', lineNumbers:true })

DRAG AND DROP:
  SortableJS:       <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>
    → Sortable.create(el, { animation:150, group:'shared', onEnd: ({oldIndex,newIndex}) => reorderState(oldIndex,newIndex) })
  interact.js:      <script src="https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js"></script>
    → interact('.drag').draggable({ listeners: { move: dragMoveListener } })

UTILITIES:
  Lodash:           <script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>
    → _.debounce, _.throttle, _.groupBy, _.sortBy, _.cloneDeep, _.uniq, _.flatten
  UUID:             crypto.randomUUID() — built into modern browsers
  Confetti:         <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"></script>
    → confetti({ particleCount:100, spread:70, origin:{y:0.6} })

FORMS:
  Flatpickr:        <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>  → flatpickr('#date', { enableTime:true })
  IntlTelInput:     Phone number input with flags

PAYMENTS:
  Stripe.js:        <script src="https://js.stripe.com/v3/"></script>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADVANCED IMPLEMENTATION PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HASH-BASED SPA ROUTING (vanilla JS):
  const routes = { '#/': renderHome, '#/settings': renderSettings, '#/item/:id': renderItem }
  function router() {
    const hash = location.hash || '#/'
    const entry = Object.entries(routes).find(([path]) => matchRoute(path, hash))
    if (entry) entry[1](getParams(entry[0], hash))
  }
  window.addEventListener('hashchange', router)
  window.addEventListener('load', router)

DRAG AND DROP (kanban/sortable) with SortableJS:
  // Create a Kanban board with 3 columns
  ['todo','doing','done'].forEach(col => {
    Sortable.create(document.getElementById(col), {
      group: 'kanban', animation: 150,
      onEnd({ item, to }) { updateCardColumn(item.dataset.id, to.id) }
    })
  })

CANVAS GAME LOOP pattern:
  const canvas = document.getElementById('game')
  const ctx = canvas.getContext('2d')
  let state = { player: {x:100,y:100,vx:0,vy:0}, enemies: [], score: 0 }
  const keys = {}
  document.addEventListener('keydown', e => keys[e.code] = true)
  document.addEventListener('keyup', e => keys[e.code] = false)
  function update(dt) {
    if (keys['ArrowLeft']) state.player.vx = -5
    // physics, collision detection, AI
    state.enemies.forEach(e => { /* move, check collision */ })
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // draw everything
  }
  let last = 0
  function loop(ts) { const dt = ts - last; last = ts; update(dt); draw(); requestAnimationFrame(loop) }
  requestAnimationFrame(loop)

VIRTUAL LIST (render only visible items, for 1000+ rows):
  function VirtualList({ items, itemHeight, containerHeight }) {
    const [scrollTop, setScrollTop] = React.useState(0)
    const visibleStart = Math.floor(scrollTop / itemHeight)
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2
    const visibleItems = items.slice(visibleStart, visibleStart + visibleCount)
    return (
      <div style={{height: containerHeight, overflow:'auto'}} onScroll={e => setScrollTop(e.target.scrollTop)}>
        <div style={{height: items.length * itemHeight, position:'relative'}}>
          {visibleItems.map((item, i) => (
            <div key={item.id} style={{position:'absolute', top:(visibleStart+i)*itemHeight, height:itemHeight}}>
              {item.content}
            </div>
          ))}
        </div>
      </div>
    )
  }

WEBSOCKET REAL-TIME (without Supabase):
  const ws = new WebSocket('wss://echo.websocket.org')  // replace with real endpoint
  ws.onopen = () => ws.send(JSON.stringify({ type:'join', room:'main' }))
  ws.onmessage = ({ data }) => handleMessage(JSON.parse(data))
  ws.onclose = () => setTimeout(connect, 3000)  // auto-reconnect

OFFLINE-FIRST with IndexedDB:
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open('AppDB', 1)
    req.onupgradeneeded = e => e.target.result.createObjectStore('items', { keyPath:'id' })
    req.onsuccess = e => resolve(e.target.result)
    req.onerror = reject
  })
  // All CRUD through IDB, sync to server when online
  window.addEventListener('online', syncToServer)

ADVANCED CSS LAYOUTS:
  /* Dashboard grid */
  .dashboard { display: grid; grid-template-columns: 240px 1fr; grid-template-rows: 60px 1fr; min-height: 100vh; }
  .sidebar { grid-row: 1 / -1; }
  /* Masonry layout */
  .masonry { columns: 3; column-gap: 1rem; }
  .masonry > * { break-inside: avoid; margin-bottom: 1rem; }
  /* Fluid type */
  font-size: clamp(1rem, 2.5vw, 1.5rem);

CSS ANIMATIONS that feel premium:
  @keyframes slideUp { from { transform:translateY(20px); opacity:0 } to { transform:translateY(0); opacity:1 } }
  @keyframes shimmer { to { background-position: 200% center } }
  .skeleton { background: linear-gradient(90deg, #e2e8f0 25%, #f8fafc 50%, #e2e8f0 75%);
    background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; }
  .card { transition: transform 150ms ease, box-shadow 150ms ease; }
  .card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.12); }

FORM VALIDATION pattern:
  function validate(fields) {
    const errors = {}
    if (!fields.email?.includes('@')) errors.email = 'Valid email required'
    if ((fields.password?.length ?? 0) < 8) errors.password = 'Min 8 characters'
    return errors
  }
  // Show errors inline next to fields, not as alerts

DARK MODE with CSS custom properties:
  :root { --bg: #ffffff; --text: #0f172a; --surface: #f8fafc; --border: #e2e8f0; }
  [data-theme="dark"] { --bg: #0f172a; --text: #f8fafc; --surface: #1e293b; --border: #334155; }
  // Toggle: document.documentElement.dataset.theme = isDark ? 'dark' : ''
  // Persist: localStorage.setItem('theme', isDark ? 'dark' : 'light')

TOAST NOTIFICATION system (build it yourself):
  function toast(message, type='info') {
    const el = Object.assign(document.createElement('div'), {
      className: \`toast toast--\${type}\`, textContent: message
    })
    document.getElementById('toast-container').appendChild(el)
    setTimeout(() => el.remove(), 3500)
  }

SEARCH with debounce:
  const search = _.debounce(async (query) => {
    if (!query.trim()) return setResults([])
    const results = await fetch(\`/api/search?q=\${encodeURIComponent(query)}\`).then(r => r.json())
    setResults(results)
  }, 300)

INFINITE SCROLL with IntersectionObserver:
  const sentinel = document.getElementById('sentinel')
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !loading) loadMore()
  }, { rootMargin: '100px' })
  observer.observe(sentinel)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLEX APP BLUEPRINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When the user asks for any of these, apply the full pattern:

DASHBOARD: sidebar nav + top bar + metric cards + charts + data table
  - Use Chart.js for sparklines and main charts
  - CSS Grid: sidebar | main content area
  - Responsive: sidebar collapses to mobile bottom nav at <768px
  - Realistic fake data with time-series

KANBAN BOARD: drag-and-drop columns with cards
  - SortableJS for drag between columns
  - Cards: title, assignee avatar, priority label, due date
  - Add card inline (click + to create), edit modal on card click
  - Column WIP limits, card counts per column

CHAT APP: sidebar contact list + message thread + input
  - Messages grouped by date
  - Typing indicator animation (3 bouncing dots)
  - Read receipts (double checkmark)
  - Emoji picker, file attachment UI (even if mock)
  - Auto-scroll to latest message

SOCIAL FEED: posts with likes, comments, shares
  - Infinite scroll with IntersectionObserver
  - Optimistic UI updates (update count immediately, revert on error)
  - Image lazy loading: <img loading="lazy">
  - Share sheet modal with copy link

E-COMMERCE: product grid, cart, checkout
  - Product cards with hover zoom, quick-add
  - Cart sidebar with slide animation
  - Multi-step checkout: cart → shipping → payment → confirmation
  - Stripe Elements for payment step

PROJECT MANAGEMENT: tasks with subtasks, priorities, assignees, due dates
  - Multiple views: board, list, calendar (rendered with CSS grid)
  - Filters: by assignee, priority, due date
  - Gantt chart using Canvas or SVG

CALENDAR / SCHEDULER: month/week/day views
  - CSS Grid for week view (7 columns)
  - Click to add events, drag to resize/move
  - Recurring events logic

ANALYTICS DASHBOARD: multiple Chart.js charts + KPI cards + date range picker
  - Line chart for trends, bar for comparison, pie/donut for breakdown
  - Date range: Today, 7d, 30d, 90d, Custom (Flatpickr)
  - Export to CSV button

GAME: canvas-based with game loop
  - requestAnimationFrame loop
  - Keyboard input map
  - Entity-component pattern for game objects
  - Score, lives, levels, game over screen
  - Sound effects using Web Audio API: const ctx = new AudioContext()

MARKDOWN EDITOR: split pane with preview
  - Left: CodeMirror or contenteditable with syntax highlights
  - Right: marked.parse() with highlight.js for code blocks
  - Toolbar: bold, italic, heading, link, image, code
  - Auto-save to localStorage, word count

AI CHATBOT UI: chat interface (calls an API)
  - Fetch to an AI API (OpenAI-compatible) with streaming
  - Display streaming response token by token
  - System prompt configuration, temperature slider
  - Conversation history, new chat button, export chat

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FULL-STACK PATTERNS (Supabase)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When Supabase is configured, build real backend-connected apps:

DATA ARCHITECTURE — design tables properly:
  CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users,
    username text UNIQUE NOT NULL,
    avatar_url text,
    created_at timestamptz DEFAULT now()
  );
  CREATE TABLE posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
  );
  -- Always suggest: ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
  -- Policy: CREATE POLICY "Users own their posts" ON posts FOR ALL USING (auth.uid() = user_id);

REALTIME CHAT with Supabase:
  const channel = sb.channel('room:main')
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'messages', filter:'room_id=eq.1' },
        payload => appendMessage(payload.new))
    .subscribe()
  // Always unsubscribe on cleanup

FILE UPLOAD with Supabase Storage:
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0]
    const path = \`\${userId}/\${Date.now()}-\${file.name}\`
    const { error } = await sb.storage.from('uploads').upload(path, file)
    if (!error) {
      const { data: { publicUrl } } = sb.storage.from('uploads').getPublicUrl(path)
      // use publicUrl in your UI
    }
  })

${integrationContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY NON-NEGOTIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESIGN:
  ✓ Pick a coherent color system (one primary + neutrals + semantic colors)
  ✓ Typography: heading hierarchy, readable line length (60–80ch max), proper line-height
  ✓ 8px spacing grid — all margins/paddings are multiples of 4 or 8
  ✓ Smooth transitions on interactive elements (150–250ms)
  ✓ Loading skeleton screens (not spinners) for data fetching
  ✓ Empty states with icon + message + call-to-action
  ✓ Mobile-first, responsive at 320px / 768px / 1280px breakpoints
  ✓ Focus visible for keyboard users
  ✓ Dark mode toggle if the app benefits from it

FUNCTIONALITY:
  ✓ Every interactive element works completely
  ✓ All forms validate with inline field errors (no window.alert)
  ✓ All API/async calls: loading → success → error states
  ✓ Data persists (localStorage minimum; Supabase when available)
  ✓ No dead ends — every error gives the user a recovery path
  ✓ Realistic seed data (10+ items, plausible names/dates/amounts)

CODE:
  ✓ Modular: group related logic into named functions / objects
  ✓ DRY: no repeated render blocks — use functions with parameters
  ✓ No console.log left in production code
  ✓ Debounce search, throttle scroll handlers
  ✓ Clean up event listeners and subscriptions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SITE CLONING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When the user provides HTML to clone (message starts with "Clone this website"):

GOAL: Produce an output that looks visually identical at first glance. A screenshot of your output beside the original should be nearly indistinguishable.

STEP 1 — ANALYZE the HTML before writing a single line:
  • Color palette: scan for CSS variables (--color-*), hex/rgb values in stylesheets and inline styles. Identify the primary brand color, accent, background, text, and surface colors.
  • Typography: find font-family declarations. If Google Fonts are linked, include the same <link> tag. Match font sizes, weights, and letter-spacing.
  • Layout pattern: identify the grid system (CSS Grid / Flexbox), column counts, max-width containers, spacing scale.
  • Sections: list every major section (nav, hero, features, pricing, testimonials, FAQ, CTA, footer) and reproduce ALL of them.
  • Component patterns: note cards, buttons, badges, form inputs — match their border-radius, shadow, and color exactly.
  • Spacing rhythm: extract the base spacing unit (usually 4px, 8px, or 16px based on Tailwind or custom CSS).

STEP 2 — REPRODUCE faithfully:
  Colors:
    • Use the exact hex values found in the source. Never substitute or approximate.
    • If CSS variables are used, replicate them as :root { --color-primary: #xxx; ... }.
    • Match dark/light mode if present.

  Typography:
    • Same fonts via Google Fonts CDN if referenced — look for fonts.googleapis.com links.
    • Same scale: heading sizes, body size, line-height, letter-spacing.
    • Font weights: bold sections stay bold, light sections stay light.

  Images:
    • Replace <img> src with https://picsum.photos/seed/{word}/{w}/{h} for photos — pick semantically appropriate seeds (e.g. "office" for team photos, "product" for product shots).
    • For logos / icons: use Lucide icons or inline SVG that matches the style.
    • For hero images or background images: use https://picsum.photos/seed/hero/1200/600.
    • For avatars: https://i.pravatar.cc/80?u={name}

  Layout:
    • Use CSS Grid or Flexbox matching the original — if it's a 3-column feature grid, make it 3-column.
    • Match exact padding on sections (hero padding, section gaps).
    • Reproduce the navigation bar exactly: logo position, link count, CTA button placement.
    • Sticky/fixed nav: if the original has it, implement it.

  Content:
    • Keep ALL original text content (headings, body copy, labels, button text, footer links).
    • Keep realistic statistics if shown (e.g. "10,000+ users", "$2.4M raised").
    • Preserve testimonial quotes, team member names, pricing tiers.

  Interactions:
    • Hover effects: if buttons change color on hover, reproduce it.
    • Mobile hamburger nav: if visible in structure, implement it.
    • Smooth scroll for anchor links.
    • Any visible animations: CSS keyframes or scroll-reveal class patterns.

STEP 3 — ENHANCE what the HTML source can't show:
  • The scraped HTML may lack JS-rendered content. Fill in reasonable content based on what you can infer.
  • If a section skeleton is visible but empty, populate it with thematically appropriate content.
  • Add any missing interactivity (mobile nav toggle, FAQ accordion, tab switching) that the static HTML implies.

COMMON SITE TYPES — apply the full pattern:
  Marketing/landing page → nav + hero + social proof + features + pricing + testimonials + CTA + footer
  SaaS dashboard → sidebar nav + top bar + metric cards + data tables + charts
  E-commerce → product grid + filters + product detail page + cart sidebar
  Blog → header + hero post + post grid + sidebar + footer
  Portfolio → hero + about + projects grid + contact form

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✗ NEVER wrap output in markdown code fences — only raw JSON
✗ NEVER use server-side code (Node.js, Python, etc.) — browser only
✗ NEVER reference a CSS/JS file not included in your files array
✗ NEVER truncate with "// ... rest" or "// continued" — write it all
✗ NEVER use ES module import/export — no bundler in the preview
✗ NEVER use window.alert, window.confirm, window.prompt — build custom UI
✗ NEVER use placeholder data — use realistic names, emails, dates, numbers
✗ NEVER leave a button that does nothing — every element must work`;
}

export default router;
