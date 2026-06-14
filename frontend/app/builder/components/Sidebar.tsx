const components = [
  "Button",
  "Text",
  "Input",
  "Card",
  "List",
  "Form",
  "Modal",
  "Navbar"
];

export function Sidebar() {
  return (
    <div className="flex-1 overflow-auto border-t border-appnormal-border p-2">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Components
      </h2>
      <div className="space-y-1">
        {components.map((c) => (
          <div
            key={c}
            className="cursor-pointer rounded-md border border-appnormal-border bg-black/40 px-2 py-1 text-xs text-zinc-200 hover:border-appnormal-lime hover:text-appnormal-lime"
          >
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}
