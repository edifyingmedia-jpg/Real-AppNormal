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
import { Database, CreditCard, Globe, Loader2, CheckCircle2, ExternalLink, Copy, Check, Bot } from "lucide-react";

type AiModelId = "claude-opus-4-5" | "gpt-4.1" | "gemini-2.5-flash";

interface ProjectSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  supabaseUrl: string | null | undefined;
  stripePublishableKey: string | null | undefined;
  customDomain: string | null | undefined;
  aiModel: AiModelId;
}

export function ProjectSettingsDialog({
  open,
  onOpenChange,
  projectId,
  supabaseUrl,
  stripePublishableKey,
  customDomain,
  aiModel,
}: ProjectSettingsDialogProps) {
  const [sbUrl, setSbUrl] = useState(supabaseUrl ?? "");
  const [sbAnonKey, setSbAnonKey] = useState("");
  const [stripeKey, setStripeKey] = useState(stripePublishableKey ?? "");
  const [domain, setDomain] = useState(customDomain ?? "");
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [copiedCname, setCopiedCname] = useState(false);
  const queryClient = useQueryClient();
  const updateSettings = useUpdateProjectSettings();

  useEffect(() => {
    if (open) {
      setSbUrl(supabaseUrl ?? "");
      setSbAnonKey("");
      setStripeKey(stripePublishableKey ?? "");
      setDomain(customDomain ?? "");
      setOpenaiKey("");
      setGeminiKey("");
      setSaved(false);
    }
  }, [open, supabaseUrl, stripePublishableKey, customDomain]);

  const handleSave = async () => {
    setSaved(false);
    await updateSettings.mutateAsync({
      id: projectId,
      data: {
        supabaseUrl: sbUrl || null,
        supabaseAnonKey: sbAnonKey || null,
        stripePublishableKey: stripeKey || null,
        customDomain: domain || null,
        openaiApiKey: openaiKey || null,
        geminiApiKey: geminiKey || null,
      },
    });
    queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const copyCname = async () => {
    await navigator.clipboard.writeText("proxy.appnormal.com");
    setCopiedCname(true);
    setTimeout(() => setCopiedCname(false), 2000);
  };

  const supabaseConfigured = !!supabaseUrl;
  const stripeConfigured = !!stripePublishableKey;
  const domainConfigured = !!customDomain;

  const aiProviderForModel: Record<AiModelId, string> = {
    "claude-opus-4-5": "Anthropic (Claude)",
    "gpt-4.1": "OpenAI (GPT-4.1)",
    "gemini-2.5-flash": "Google (Gemini)",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Integrations & Settings</DialogTitle>
          <DialogDescription>
            Connect services to unlock full-stack AI generation. Once connected, the AI automatically uses them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* AI Integration for Generated Apps */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary/15 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">AI APIs for your app</h3>
                </div>
                <p className="text-xs text-muted-foreground">Let the AI write apps that call OpenAI or Gemini directly</p>
              </div>
            </div>
            <div className="rounded-lg bg-muted/30 border border-border px-3 py-2.5 text-xs text-muted-foreground">
              Currently building with <span className="text-foreground font-medium">{aiProviderForModel[aiModel]}</span>. Switch models using the AI picker in the toolbar.
            </div>
            <div className="space-y-2 pl-1">
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="openai-key">
                  OpenAI API Key (for your app)
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1.5 text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    Get key <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </Label>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-…"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="h-8 text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="gemini-key">
                  Gemini API Key (for your app)
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1.5 text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    Get key <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </Label>
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder="AIza…"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="h-8 text-sm font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                When set, the AI will write your app to call these APIs directly — so it can build chatbots, text generators, and other AI-powered features.
              </p>
            </div>
          </div>

          <div className="border-t border-border" />

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
              <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">
                Dashboard <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="space-y-2 pl-1">
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="sb-url">Project URL</Label>
                <Input id="sb-url" placeholder="https://xxxxxxxxxxxx.supabase.co"
                  value={sbUrl} onChange={(e) => setSbUrl(e.target.value)} className="h-8 text-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="sb-anon">Anon / Public Key</Label>
                <Input id="sb-anon" type="password"
                  placeholder={supabaseConfigured ? "Leave blank to keep existing key" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"}
                  value={sbAnonKey} onChange={(e) => setSbAnonKey(e.target.value)} className="h-8 text-sm font-mono" />
                <p className="text-xs text-muted-foreground">
                  Find these under your project → Settings → API.
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
              <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">
                API Keys <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="pl-1 space-y-1.5">
              <Label className="text-xs" htmlFor="stripe-key">Publishable Key</Label>
              <Input id="stripe-key" placeholder="pk_live_…  or  pk_test_…"
                value={stripeKey} onChange={(e) => setStripeKey(e.target.value)} className="h-8 text-sm font-mono" />
              <p className="text-xs text-muted-foreground">
                Use your publishable key only — never your secret key.
              </p>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Custom Domain */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-500/15 flex items-center justify-center shrink-0">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">Custom Domain</h3>
                  {domainConfigured && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400">Configured</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Serve your published app on your own domain</p>
              </div>
            </div>
            <div className="pl-1 space-y-2">
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="custom-domain">Domain</Label>
                <Input id="custom-domain" placeholder="app.yourdomain.com"
                  value={domain} onChange={(e) => setDomain(e.target.value)} className="h-8 text-sm font-mono" />
              </div>
              {domain && (
                <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-2">
                  <p className="text-xs font-medium text-foreground">DNS Setup</p>
                  <p className="text-xs text-muted-foreground">
                    Add a <code className="text-foreground/80 bg-muted px-1 rounded">CNAME</code> record at your DNS provider:
                  </p>
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-xs font-mono">
                    <span className="text-muted-foreground">CNAME</span>
                    <span className="text-foreground/80 truncate">{domain}</span>
                    <span className="text-muted-foreground">→</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs text-primary bg-primary/10 rounded px-2 py-1 font-mono">
                      proxy.appnormal.com
                    </code>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={copyCname}>
                      {copiedCname ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    DNS changes may take up to 48 hours to propagate.
                  </p>
                </div>
              )}
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
              {saved ? "Saved!" : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
