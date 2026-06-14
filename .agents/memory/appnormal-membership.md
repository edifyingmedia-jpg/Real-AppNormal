---
name: AppNormal membership system
description: Clerk + Stripe + DB tier system for AppNormal — credit model, JIT provisioning, feature gating pattern.
---

## Tier model
- Free: 10 one-time credits (default on signup)
- Creator: $14.99/mo — 100 credits/period
- Studio: $29.99/mo — 300 credits/period
- Credit Bundle: $14.99/200 credits (one-time)
- 1 credit = 50,000 tokens (Anthropic Claude)
- Yearly plans: 20% more credits upfront (via Stripe price metadata)

## DB schema
- `lib/db/src/schema/users.ts` — users table: id (Clerk ID), email, tier, credits_remaining (default 10), stripe_customer_id, stripe_subscription_id

## JIT Provisioning
- `GET /api/users/me` (requireAuth) — provisions user from Clerk on first API call, returns tier + creditsRemaining
- Frontend hook: `artifacts/lovable-clone/src/hooks/use-current-user.ts` — calls /api/users/me when signed in
- `ClerkQueryClientCacheInvalidator` in App.tsx calls `qc.clear()` on user change, which triggers refetch of `["currentUser"]`

## Credit deduction
- In anthropic route (`/api/anthropic/conversations/:id/messages`): checks user credits BEFORE generating, deducts AFTER
- Deduction: `Math.max(1, Math.ceil(messageTokens / 50_000))` credits per build
- Uses `GREATEST(0, credits_remaining - N)` so it never goes negative
- Also maintains conversation-level token tracking (legacy, for credit meter in chat UI)

## Feature gating
- `requiresPaidTier` middleware in `artifacts/api-server/src/middlewares/requiresPaidTier.ts`
- Returns 403 `{ error: "Upgrade required", message: "..." }` for free tier users
- Applied to: `POST /api/projects/:id/publish`, `POST /api/projects/:id/github/push`
- Frontend dialogs handle 403 with upgrade prompt (publish-dialog.tsx updated with Crown/Zap UI)

## Stripe wiring
- `stripe-replit-sync` handles webhook processing and DB sync (stripe schema)
- `MigrationConfig` has NO `schema` property — just `{ databaseUrl, ssl?, logger? }`
- `findOrCreateManagedWebhook` returns `Stripe.WebhookEndpoint` directly (NOT `{ webhook: WebhookEndpoint }`)
- `initStripe()` in `index.ts` gracefully skips if Stripe not connected (catches 401)
- Seed script: `pnpm --filter @workspace/scripts run seed-products` (run AFTER Stripe connected)

## Stripe price metadata format
Prices must have metadata: `{ tier: "creator"|"studio"|"bundle", credits: "100", billing: "monthly"|"yearly"|"one-time" }`
Webhook handler uses this to grant credits on `checkout.session.completed`

## Key env vars
- CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, VITE_CLERK_PUBLISHABLE_KEY, VITE_CLERK_PROXY_URL — set via Clerk integration
- DATABASE_URL — Postgres connection string

**Why:** Credit system is user-level (not conversation-level) so credits persist across projects. Feature gating is server-side (middleware) not just UI — prevents API bypass.
