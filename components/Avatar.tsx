type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-xl",
  lg: "h-24 w-24 text-3xl",
};

export default function Avatar({
  initials,
  size = "md",
}: {
  initials: string;
  size?: Size;
}) {
  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand-soft-fg`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
