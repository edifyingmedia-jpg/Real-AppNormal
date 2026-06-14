export function Canvas() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed border-appnormal-border bg-gradient-to-br from-zinc-900 to-black">
      <div className="mb-3 text-xs uppercase tracking-wide text-zinc-500">
        Canvas
      </div>
      <div className="h-64 w-96 rounded-xl border border-appnormal-border bg-black/70 shadow-[0_0_40px_rgba(180,255,57,0.25)]" />
      <p className="mt-3 max-w-xs text-center text-[11px] text-zinc-500">
        This is your app surface. Components you add will appear here. Later we
        can wire this to real schema + layout.
      </p>
    </div>
  );
}
