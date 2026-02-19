"use client";

import { cn } from "@/lib/utils";
import { type UnitSystem } from "@/lib/engine/units";

interface UnitToggleProps {
  value: UnitSystem;
  onChange: (system: UnitSystem) => void;
}

export function UnitToggle({ value, onChange }: UnitToggleProps) {
  return (
    <div className="inline-flex rounded-[8px] bg-[#F3F4F6] p-1 gap-1">
      <ToggleButton
        active={value === "SI"}
        onClick={() => onChange("SI")}
        label="SI (Metric)"
      />
      <ToggleButton
        active={value === "Imperial"}
        onClick={() => onChange("Imperial")}
        label="Imperial"
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[6px] px-4 py-[8px] text-[14px] font-medium transition-all duration-150 ease-in-out",
        active
          ? "bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          : "text-[#6B7280] hover:text-[#374151]",
      )}
    >
      {label}
    </button>
  );
}
