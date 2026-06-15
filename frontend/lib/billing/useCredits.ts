// frontend/lib/billing/useCredits.ts

"use client";

import { useEffect, useState, useCallback } from "react";

interface CreditState {
  remaining: number;
  total: number;
  used: number;
  membershipPlan: string | null;
  freeTierClaimed: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

// =====================================
// API CALL (Replace with your real API)
// =====================================

async function fetchCredits(): Promise<{
  remaining: number;
  total: number;
  used: number;
  membershipPlan: string | null;
  freeTierClaimed: boolean;
}> {
  // TODO: Replace with your real API endpoint
  const res = await fetch("/api/credits");
  if (!res.ok) throw new Error("Failed to load credits");
  return res.json();
}

// =====================================
// REACT HOOK
// =====================================

export function useCredits(): CreditState {
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [used, setUsed] = useState(0);
  const [membershipPlan, setMembershipPlan] = useState<string | null>(null);
  const [freeTierClaimed, setFreeTierClaimed] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCredits();

      setRemaining(data.remaining);
      setTotal(data.total);
      setUsed(data.used);
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
    remaining,
    total,
    used,
    membershipPlan,
    freeTierClaimed,
    loading,
    refresh: load,
  };
}
