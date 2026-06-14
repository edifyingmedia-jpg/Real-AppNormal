export function PropertiesPanel() {
  return (
    <div className="flex h-full flex-col gap-3 text-xs text-zinc-200">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Properties
      </h2>

      <div className="space-y-1">
        <label className="block text-[11px] text-zinc-400">Label</label>
        <input
          className="w-full rounded-md border border-appnormal-border bg-black/60 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-appnormal-lime"
          placeholder="Button text"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-[11px] text-zinc-400">Color</label>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-appnormal-lime" />
          <input
            className="w-full rounded-md border border-appnormal-border bg-black/60 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-appnormal-lime"
            defaultValue="#b4ff39"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-[11px] text-zinc-400">Radius</label>
        <input
          type="range"
          min={0}
          max={32}
          className="w-full accent-appnormal-lime"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-[11px] text-zinc-400">Logic</label>
        <textarea
          className="h-24 w-full resize-none rounded-md border border-appnormal-border bg-black/60 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-appnormal-lime"
          placeholder="onClick → navigate('/dashboard')"
        />
      </div>
    </div>
  );
}
