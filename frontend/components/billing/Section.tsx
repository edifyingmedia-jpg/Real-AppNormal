"use client";

export default function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10 p-6 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
      {title && (
        <h2 className="text-xl font-semibold mb-4">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
