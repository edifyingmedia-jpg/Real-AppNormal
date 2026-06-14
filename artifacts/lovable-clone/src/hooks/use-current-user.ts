import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";

export interface CurrentUser {
  id: string;
  email: string;
  tier: "free" | "creator" | "studio";
  creditsRemaining: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export function useCurrentUser() {
  const { isSignedIn } = useAuth();

  return useQuery<CurrentUser>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load user");
      return res.json();
    },
    enabled: !!isSignedIn,
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}
