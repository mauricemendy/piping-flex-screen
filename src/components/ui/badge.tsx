import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

type Variant = "default" | "pass" | "fail" | "warning";

const variants: Record<Variant, string> = {
  default: "bg-[#F3F4F6] text-[#374151]",
  pass: "bg-[#0D9488] text-white",
  fail: "bg-[#FEE2E2] text-[#DC2626]",
  warning: "bg-[#FEF3C7] text-[#D97706]",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] px-[10px] py-[4px] text-[10px] font-semibold uppercase tracking-[0.05em]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
