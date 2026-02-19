import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  unit?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", unit, ...props }, ref) => (
    <div className="relative">
      <input
        type={type}
        className={cn(
          "flex h-[44px] w-full rounded-[8px] border border-[#D1D5DB] bg-white px-[14px] py-[10px] text-[14px] text-[#111827]",
          "placeholder:text-[#9CA3AF]",
          "focus:outline-none focus:border-[#0D9488] focus:shadow-[0_0_0_3px_rgba(13,148,136,0.15)]",
          "disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF]",
          "transition-all duration-150 ease-in-out",
          unit && "pr-14",
          className,
        )}
        ref={ref}
        {...props}
      />
      {unit && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#9CA3AF] pointer-events-none">
          {unit}
        </span>
      )}
    </div>
  ),
);
Input.displayName = "Input";
