export function ChatPanel() {
  return (
    <div className="flex h-full flex-col text-xs text-zinc-200">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        AppNormal AI
      </h2>
      <div className="flex-1 space-y-2 overflow-auto rounded-md border border-appnormal-border bg-black/50 p-2">
        <div className="rounded-md bg-zinc-900/80 p-2 text-[11px] text-zinc-200">
          <span className="font-semibold text-appnormal-lime">AppNormal · </span>
          Describe the app you want, and I’ll scaffold screens, data, and logic.
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          className="flex-1 rounded-md border border-appnormal-border bg-black/70 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-appnormal-lime"
          placeholder="Describe a dashboard app with auth, billing, and a projects view…"
        />
        <button className="rounded-md bg-appnormal-lime px-3 py-1 text-[11px] font-semibold text-black hover:brightness-110">
          Send
        </button>
      </div>
    </div>
  );
}
