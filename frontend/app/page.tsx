"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PlanId = "starter" | "pro" | "studio";

const PLANS: { id: PlanId; name: string; price: string; description: string }[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$9/mo",
    description: "For simple apps and first launches."
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29/mo",
    description: "For growing apps, teams, and more traffic."
  },
  {
    id: "studio",
    name: "Studio",
    price: "$79/mo",
    description: "For serious production apps and studios."
  }
];

export default function LandingPage() {
  const router = useRouter();
  const [appIdea, setAppIdea] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("starter");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStartBuilding = () => {
    if (!appIdea.trim()) return;
    setIsGenerating(true);

    const params = new URLSearchParams({
      idea: appIdea.trim(),
      plan: selectedPlan
    });

    router.push(`/builder?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Top bar */}
      <header className="h-14 border-b border-[#181818] flex items-center justify-between px-6 bg-[#050505]">
        <div className="flex items-center gap-2">
          <span className="text-lime-400 font-semibold">AppNormal</span>
          <span className="text-xs text-gray-400">No‑code AI app studio</span>
        </div>
        <button
          onClick={() => router.push("/builder")}
          className="px-3 py-1 rounded bg-[#181818] hover:bg-[#262626] text-xs"
        >
          Go to workspace
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="max-w-3xl w-full space-y-8">
          {/* Hero */}
          <section className="space-y-4 text-center">
            <h1 className="text-3xl md:text-4xl font-semibold">
              Describe your app in simple language.
            </h1>
            <p className="text-sm md:text-base text-gray-400">
              AppNormal turns plain language into real, publishable apps—without panels, clutter, or
              developer cockpit energy.
            </p>
          </section>

          {/* App idea input */}
          <section className="space-y-3">
            <label className="block text-xs text-gray-400 text-left">
              What do you want to build?
            </label>
            <textarea
              value={appIdea}
              onChange={(e) => setAppIdea(e.target.value)}
              placeholder="Example: A simple membership site where users can log in, see their dashboard, and upgrade their plan."
              className="w-full min-h-[120px] bg-[#0b0b0b] border border-[#181818] rounded-lg p-3 text-sm text-gray-200 outline-none resize-none"
            />
          </section>

          {/* Membership plans */}
          <section className="space-y-3">
            <p className="text-xs text-gray-400">Choose a membership plan to generate and publish:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left text-xs transition ${
                    selectedPlan === plan.id
                      ? "border-lime-400 bg-[#101010]"
                      : "border-[#181818] bg-[#080808] hover:bg-[#101010]"
                  }`}
                >
                  <span className="font-semibold text-sm">{plan.name}</span>
                  <span className="text-lime-400 font-medium">{plan.price}</span>
                  <span className="text-gray-400">{plan.description}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Call to action */}
          <section className="flex flex-col md:flex-row items-center justify-between gap-3">
            <button
              onClick={handleStartBuilding}
              disabled={isGenerating || !appIdea.trim()}
              className="w-full md:w-auto px-4 py-2 rounded bg-lime-400 text-black text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? "Sending to workspace..." : "Send to workspace"}
            </button>
            <p className="text-[11px] text-gray-500 text-left md:text-right">
              Your idea and selected plan will open directly in the AppNormal workspace.  
              No extra panels. No learning curve.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
