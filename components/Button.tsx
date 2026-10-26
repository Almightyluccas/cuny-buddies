import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "outline";

const base =
  "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  outline: "border border-border bg-surface text-foreground hover:bg-bg",
};

function classes(variant: Variant, className?: string) {
  return `${base} ${variants[variant]} ${className ?? ""}`.trim();
}

type ButtonAsButton = {
  href?: undefined;
  variant?: Variant;
  children: ReactNode;
} & ComponentProps<"button">;

type ButtonAsLink = {
  href: string;
  variant?: Variant;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "href" | "children">;

export default function Button(props: ButtonAsButton | ButtonAsLink) {
  if (props.href !== undefined) {
    const { href, variant = "primary", className, children, ...rest } = props;
    return (
      <Link href={href} className={classes(variant, className)} {...rest}>
        {children}
      </Link>
    );
  }
  const { variant = "primary", className, children, ...rest } = props;
  return (
    <button className={classes(variant, className)} {...rest}>
      {children}
    </button>
  );
}
