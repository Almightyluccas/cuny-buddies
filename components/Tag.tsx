import type { ReactNode } from "react";

type Variant = "soft" | "outline" | "active";

const variants: Record<Variant, string> = {
  soft: "bg-brand-soft text-brand-soft-fg",
  outline: "border border-border text-foreground",
  active: "bg-brand text-white",
};

export default function Tag({
  children,
  variant = "soft",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
