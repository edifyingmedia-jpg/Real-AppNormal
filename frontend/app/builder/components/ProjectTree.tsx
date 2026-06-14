const nodes = [
  { type: "screen", name: "Home" },
  { type: "screen", name: "Dashboard" },
  { type: "screen", name: "Settings" }
];

export function ProjectTree() {
  return (
    <div className="border-b border-appnormal-border p-2">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Project
      </h2>
      <div className="space-y-1 text-xs">
        {nodes.map((n) => (
          <div
            key={n.name}
            className="flex items-center justify-between rounded-md bg-black/40 px-2 py-1 text-zinc-200"
          >
            <span>{n.name}</span>
            <span className="text-[10px] uppercase text-zinc-500">
              {n.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
