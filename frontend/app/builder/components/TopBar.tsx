export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-appnormal-border bg-black/70 px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-md bg-appnormal-lime" />
        <span className="text-sm font-semibold tracking-wide text-appnormal-lime">
          AppNormal
        </span>
        <span className="text-xs text-zinc-400">Builder</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <button className="rounded-md border border-appnormal-border px-3 py-1 text-zinc-300 hover:border-appnormal-lime hover:text-appnormal-lime">
          Undo
        </button>
        <button className="rounded-md border border-appnormal-border px-3 py-1 text-zinc-300 hover:border-appnormal-lime hover:text-appnormal-lime">
          Redo
        </button>
        <button className="rounded-md bg-appnormal-lime px-3 py-1 text-xs font-semibold text-black hover:brightness-110">
          Publish
        </button>
      </div>
    </header>
  );
}
