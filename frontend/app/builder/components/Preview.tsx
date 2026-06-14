export function Preview() {
  return (
    <div className="flex h-full flex-col justify-between text-xs text-zinc-200">
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Preview
        </h2>
        <p className="text-[11px] text-zinc-400">
          This area will show a live preview of the app state. For now, it’s a
          placeholder.
        </p>
      </div>
      <div className="rounded-md border border-appnormal-border bg-black/60 p-3 text-[11px] text-zinc-300">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">
          State snapshot
        </div>
        <pre className="overflow-auto text-[10px] text-zinc-400">
{`{
  "screen": "Home",
  "selection": "Button",
  "theme": "dark-lime"
}`}
        </pre>
      </div>
    </div>
  );
}
