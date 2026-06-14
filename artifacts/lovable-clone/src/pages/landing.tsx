import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { TerminalSquare, Sparkles, Check, Zap, Globe, Github, Download, ChevronRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

const CREDITS_PER_UNIT = 50_000;

const TIERS = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    credits: { monthly: 10, yearly: 10 },
    creditsLabel: "10 credits — one-time",
    features: [
      "10 one-time AI credits",
      "Up to 3 projects",
      "In-browser preview",
      "Community support",
    ],
    locked: ["Publish to web", "Push to GitHub", "Download code"],
    tier: "free",
    highlight: false,
    cta: "Get Started Free",
    priceLabel: { monthly: "Free", yearly: "Free" },
  },
  {
    name: "Creator",
    price: { monthly: 1499, yearly: 14390 },
    credits: { monthly: 100, yearly: 1440 },
    creditsLabel: { monthly: "100 credits / month", yearly: "1,440 credits upfront" },
    features: [
      "100 AI credits per month",
      "Unlimited projects",
      "Publish to web",
      "Push to GitHub",
      "Download code",
      "Priority support",
    ],
    locked: [],
    tier: "creator",
    highlight: true,
    cta: "Start Building",
    priceLabel: { monthly: "$14.99/mo", yearly: "$143.90/yr" },
    yearlySaving: "Save 20%",
  },
  {
    name: "Studio",
    price: { monthly: 2999, yearly: 28790 },
    credits: { monthly: 300, yearly: 4320 },
    creditsLabel: { monthly: "300 credits / month", yearly: "4,320 credits upfront" },
    features: [
      "300 AI credits per month",
      "Unlimited projects",
      "Publish to web",
      "Push to GitHub",
      "Download code",
      "Supabase & Stripe integrations",
      "Priority support + SLA",
    ],
    locked: [],
    tier: "studio",
    highlight: false,
    cta: "Go Studio",
    priceLabel: { monthly: "$29.99/mo", yearly: "$287.90/yr" },
    yearlySaving: "Save 20%",
  },
];

const FEATURES = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "Claude AI Engine",
    desc: "Powered by Anthropic's claude-opus-4-5 — the most capable model for complex code generation.",
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "Publish Instantly",
    desc: "One-click deployment to a public URL. Share your app with anyone, anywhere.",
  },
  {
    icon: <Github className="w-5 h-5" />,
    title: "Push to GitHub",
    desc: "Your code, your repo. Push directly to GitHub and keep full ownership.",
  },
  {
    icon: <Download className="w-5 h-5" />,
    title: "Download Code",
    desc: "Export clean, runnable source code. No lock-in, ever.",
  },
];

async function createCheckout(priceId: string): Promise<{ url: string }> {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ priceId, returnOrigin: window.location.origin }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Checkout failed");
  }
  return res.json();
}

async function fetchProductsByTier(): Promise<Record<string, { monthly?: string; yearly?: string }>> {
  try {
    const res = await fetch("/api/stripe/products-with-prices");
    if (!res.ok) return {};
    const { data } = await res.json();
    const map: Record<string, { monthly?: string; yearly?: string }> = {};
    for (const product of data ?? []) {
      for (const price of product.prices ?? []) {
        const meta = price.metadata ?? {};
        const tier = meta.tier;
        const billing = meta.billing;
        if (!tier || tier === "bundle") continue;
        if (!map[tier]) map[tier] = {};
        if (billing === "monthly") map[tier].monthly = price.id;
        if (billing === "yearly") map[tier].yearly = price.id;
      }
    }
    return map;
  } catch {
    return {};
  }
}

export default function Landing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [priceMap, setPriceMap] = useState<Record<string, { monthly?: string; yearly?: string }>>({});
  const [loaded, setLoaded] = useState(false);
  const { isSignedIn } = useUser();
  const [, navigate] = useLocation();

  useState(() => {
    fetchProductsByTier().then((map) => {
      setPriceMap(map);
      setLoaded(true);
    });
  });

  const checkoutMutation = useMutation({
    mutationFn: createCheckout,
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
  });

  const handleTierClick = (tier: (typeof TIERS)[0]) => {
    if (tier.tier === "free") {
      navigate("/sign-up");
      return;
    }
    if (!isSignedIn) {
      navigate("/sign-up");
      return;
    }
    const priceId = priceMap[tier.tier]?.[billing];
    if (!priceId) return;
    checkoutMutation.mutate(priceId);
  };

  return (
    <div className="min-h-screen bg-[#080b10] text-slate-200">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-5 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <TerminalSquare className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-white tracking-tight">AppNormal</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => navigate("/sign-in")}
          >
            Sign In
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-500 text-white border-0 rounded-full px-5"
            onClick={() => navigate("/sign-up")}
          >
            Get Started Free
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1f35] via-[#080b10] to-[#080b10] -z-10" />
        <div
          className="absolute inset-0 opacity-[0.07] -z-10"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Claude AI
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-slate-400">
          Build full-stack apps with AI
        </h1>

        <p className="text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
          Describe what you want to build. AppNormal writes the code, wires the backend, and helps you ship it live.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button
            size="lg"
            onClick={() => navigate("/sign-up")}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-10 h-13 text-base shadow-[0_0_60px_-10px_rgba(37,99,235,0.6)] border-0"
          >
            Start Building Free
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => navigate("/sign-in")}
            className="rounded-full px-10 h-13 text-base border border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            Sign In
          </Button>
        </div>

        <p className="text-sm text-slate-500 mt-5">No credit card required · 10 free credits · Cancel anytime</p>
      </section>

      {/* Features */}
      <section className="py-20 px-6 lg:px-12 border-t border-slate-800/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Everything you need to ship</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-[#0f1420] border border-slate-800/70 rounded-xl p-6 hover:border-slate-700 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 lg:px-12 border-t border-slate-800/30" id="pricing">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-3">Simple, transparent pricing</h2>
          <p className="text-center text-slate-400 mb-8">Start free. Upgrade when you're ready to ship.</p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${billing === "monthly" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${billing === "yearly" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Yearly
              <span className="ml-1.5 text-xs text-emerald-400 font-semibold">Save 20%</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((tier) => {
              const hasPrice =
                tier.tier === "free" ||
                (loaded && (priceMap[tier.tier]?.[billing] != null));
              const priceLabel =
                tier.tier === "free"
                  ? "Free"
                  : typeof tier.priceLabel === "object"
                    ? tier.priceLabel[billing]
                    : tier.priceLabel;
              const creditsLabel =
                typeof tier.creditsLabel === "object"
                  ? tier.creditsLabel[billing]
                  : tier.creditsLabel;

              return (
                <div
                  key={tier.name}
                  className={`relative flex flex-col rounded-xl border p-6 ${
                    tier.highlight
                      ? "border-blue-500/60 bg-gradient-to-b from-blue-950/40 to-[#0f1420] shadow-[0_0_60px_-20px_rgba(59,130,246,0.4)]"
                      : "border-slate-800/70 bg-[#0f1420]"
                  }`}
                >
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">{priceLabel}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{creditsLabel}</p>
                    {billing === "yearly" && tier.tier !== "free" && (
                      <p className="text-xs text-emerald-400 mt-0.5 font-medium">
                        ✓ Full year of credits granted upfront
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                    {tier.locked.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-600 line-through">
                        <span className="w-4 h-4 mt-0.5 shrink-0 text-center">✕</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full rounded-lg ${
                      tier.highlight
                        ? "bg-blue-600 hover:bg-blue-500 text-white border-0"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    }`}
                    disabled={checkoutMutation.isPending && checkoutMutation.variables !== priceMap[tier.tier]?.[billing]}
                    onClick={() => handleTierClick(tier)}
                  >
                    {checkoutMutation.isPending ? "Loading..." : tier.cta}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Credit bundle */}
          <div className="mt-8 border border-slate-800/70 bg-[#0f1420] rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Credit Bundle</h3>
                <p className="text-sm text-slate-400">200 bonus credits — added instantly to any plan for $14.99</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-200 hover:bg-slate-800 whitespace-nowrap"
              onClick={() => {
                if (!isSignedIn) { navigate("/sign-up"); return; }
                const priceId = priceMap["bundle"]?.["monthly"] ?? priceMap["bundle"]?.["yearly"];
                if (priceId) checkoutMutation.mutate(priceId);
              }}
            >
              Buy Bundle — $14.99
            </Button>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 text-center border-t border-slate-800/30">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to build something?</h2>
        <p className="text-slate-400 mb-8">10 free credits. No credit card. Ship your first app in minutes.</p>
        <Button
          size="lg"
          onClick={() => navigate("/sign-up")}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-12 h-13 text-base shadow-[0_0_60px_-10px_rgba(37,99,235,0.5)] border-0"
        >
          Get Started Free
        </Button>
      </section>

      <footer className="py-8 px-6 border-t border-slate-800/30 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
          <TerminalSquare className="w-4 h-4" />
          <span>AppNormal — Build smarter, ship faster.</span>
        </div>
      </footer>
    </div>
  );
}
