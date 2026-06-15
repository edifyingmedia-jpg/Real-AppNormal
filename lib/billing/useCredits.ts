import { useEffect, useState } from "react";
import { getCredits } from "./credits";

export function useCredits(userId: string | null) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      setLoading(true);
      const value = await getCredits(userId);
      setCredits(value);
      setLoading(false);
    }

    load();
  }, [userId]);

  return { credits, loading };
}
