// frontend/lib/billing/useCredits.ts

"use client";

import { useEffect, useState, useCallback } from "react";

interface CreditState {
  credits: number;
  monthlyCredits: number;
  ledger: Array<{
    amount: number;
    reason: string;
    date: string;
  }>;
  membershipPlan: string | null;
  freeTierClaimed: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

// =====================================
// API CALL (Replace with your real API)
// =====================================

async function fetchCredits(): Promise<{
  credits: number;
  monthlyCredits: number;
  ledger: Array<{
    amount: number;
    reason: string;
    date: string;
  }>;
  membershipPlan: string | null;
  freeTierClaimed: boolean;
}> {
  const res = await fetch("/api/credits");
  if (!res.ok) throw new Error("Failed to load credits");
  return res.json();
}

// =====================================
// REACT HOOK
// =====================================

export function useCredits(): CreditState {
  const [credits, setCredits] = useState(0);
  const [monthlyCredits, setMonthlyCredits] = useState(0);
  const [ledger, setLedger] = useState<
    Array<{ amount: number; reason: string; date: string }>
  >([]);
  const [membershipPlan, setMembershipPlan] = useState<string | null>(null);
  const [freeTierClaimed, setFreeTierClaimed] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCredits();

      setCredits(data.credits);
      setMonthlyCredits(data.monthlyCredits);
      setLedger(data.ledger);
      setMembershipPlan(data.membershipPlan);
      setFreeTierClaimed(data.freeTierClaimed);
    } catch (err) {
      console.error("Failed to load credits:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    credits,
    monthlyCredits,
    ledger,
    membershipPlan,
    freeTierClaimed,
    loading,
    refresh: load,
  };
}
