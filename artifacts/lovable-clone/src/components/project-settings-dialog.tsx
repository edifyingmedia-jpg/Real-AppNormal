import { useState, useEffect } from "react";
import { useUpdateProjectSettings, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Database, CreditCard, Loader2, CheckCircle2, ExternalLink } from "lucide-react";

interface ProjectSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  supabaseUrl: string | null | undefined;
  stripePublishableKey: string | null | undefined;
}

export function ProjectSettingsDialog({
  open,
  onOpenChange,
  projectId,
  supabaseUrl,
  stripePublishableKey,
}: ProjectSettingsDialogProps) {
  const [sbUrl, setSbUrl] = useState(supabaseUrl ?? "");
  const [sbAnonKey, setSbAnonKey] = useState("");
  const [stripeKey, setStripeKey] = useState(stripePublishableKey ?? "");
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();
  const updateSettings = useUpdateProjectSettings();

  useEffect(() => {
    if (open) {
      setSbUrl(supabaseUrl ?? "");
      setSbAnonKey("");
      setStripeKey(stripePublishableKey ?? "");
      setSaved(false);
    }
  }, [open, supabaseUrl, stripePublishableKey]);

  const handleSave = async () => {
    setSaved(false);
    await updateSettings.mutateAsync({
      id: projectId,
      data: {
        supabaseUrl: sbUrl || null,
        supabaseAnonKey: sbAnonKey || null,
        stripePublishableKey: stripeKey || null,
      },
    });
    queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const supabaseConfigured = !!supabaseUrl;
  const stripeConfigured = !!stripePublishableKey;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Integrations</DialogTitle>
          <DialogDescription>
            Connect services to unlock full-stack AI generation. Once connected, the AI automatically uses these in generated code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Supabase */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">Supabase</h3>
                  {supabaseConfigured && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">Connected</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Auth, database, realtime &amp; storage</p>
              </div>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
              >
                Dashboard <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="space-y-2 pl-1">
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="sb-url">Project URL</Label>
                <Input
                  id="sb-url"
                  placeholder="https://xxxxxxxxxxxx.supabase.co"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  className="h-8 text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="sb-anon">Anon / Public Key</Label>
                <Input
                  id="sb-anon"
                  type="password"
                  placeholder={supabaseConfigured ? "Leave blank to keep existing key" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"}
                  value={sbAnonKey}
                  onChange={(e) => setSbAnonKey(e.target.value)}
                  className="h-8 text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Find these under your project → Settings → API in the Supabase dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Stripe */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-violet-500/15 flex items-center justify-center shrink-0">
                <CreditCard className="w-3.5 h-3.5 text-violet-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">Stripe</h3>
                  {stripeConfigured && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-500">Connected</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Payments, subscriptions &amp; billing</p>
              </div>
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
              >
                API Keys <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="pl-1 space-y-1.5">
              <Label className="text-xs" htmlFor="stripe-key">Publishable Key</Label>
              <Input
                id="stripe-key"
                placeholder="pk_live_…  or  pk_test_…"
                value={stripeKey}
                onChange={(e) => setStripeKey(e.target.value)}
                className="h-8 text-sm font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Use your publishable key only — never your secret key.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateSettings.isPending}>
              {updateSettings.isPending
                ? <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                : saved
                ? <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-green-500" />
                : null}
              {saved ? "Saved!" : "Save Integrations"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
