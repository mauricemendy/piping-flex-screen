"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type ScreeningResult } from "@/lib/engine/calculator";
import { type FormData } from "@/components/screening-form";

export interface ComparisonCase {
  id: string;
  name: string;
  formData: FormData;
  result: ScreeningResult;
}

interface ComparisonPanelProps {
  cases: ComparisonCase[];
  onRemove: (id: string) => void;
  onLoad: (formData: FormData) => void;
  onClear: () => void;
}

interface RowDef {
  label: string;
  getValue: (c: ComparisonCase) => string;
  highlight?: (c: ComparisonCase) => "best" | "worst" | null;
}

const rows: RowDef[] = [
  { label: "Code", getValue: (c) => c.result.code },
  { label: "Material", getValue: (c) => c.formData.material.split(" (")[0] },
  { label: "NPS", getValue: (c) => c.formData.nps },
  { label: "Schedule", getValue: (c) => c.formData.schedule },
  { label: "T design", getValue: (c) => `${c.formData.T1} °C` },
  { label: "L (dev.)", getValue: (c) => `${c.formData.L} m` },
  { label: "U (anchor)", getValue: (c) => `${c.formData.U} m` },
  { label: "L − U", getValue: (c) => `${c.result.effectiveLength.toFixed(1)} m` },
  { label: "y (total)", getValue: (c) => `${c.result.y.toFixed(1)} mm` },
  {
    label: "Ratio",
    getValue: (c) =>
      c.result.ratio === Infinity ? "\u221E" : c.result.ratio.toFixed(1),
  },
  {
    label: "Utilization",
    getValue: (c) =>
      c.result.utilization === Infinity
        ? "---"
        : `${(c.result.utilization * 100).toFixed(0)}%`,
    highlight: (c) => {
      if (c.result.utilization <= 1) return "best";
      return "worst";
    },
  },
  {
    label: "SA",
    getValue: (c) => `${c.result.SA.toFixed(1)} MPa`,
  },
];

export function ComparisonPanel({
  cases,
  onRemove,
  onLoad,
  onClear,
}: ComparisonPanelProps) {
  if (cases.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F4F6]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </div>
          <p className="text-[16px] font-semibold text-[#111827]">No Cases to Compare</p>
          <p className="mt-1 text-[14px] text-[#6B7280]">
            Click &quot;+ Compare&quot; to add the current screening result.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Find best/worst utilization for highlighting
  const utilValues = cases.map((c) => c.result.utilization).filter(isFinite);
  const minUtil = Math.min(...utilValues);
  const maxUtil = Math.max(...utilValues);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <Overline>Comparison ({cases.length} cases)</Overline>
        <button
          onClick={onClear}
          className="text-[11px] font-medium text-[#DC2626] hover:text-[#B91C1C] transition-colors"
        >
          Clear All
        </button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              <th className="pb-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-[0.05em] text-[#9CA3AF]">
                Parameter
              </th>
              {cases.map((c) => (
                <th key={c.id} className="pb-2 px-2 text-center min-w-[100px]">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant={c.result.analysisRequired ? "fail" : "pass"}>
                      {c.result.analysisRequired ? "FAIL" : "PASS"}
                    </Badge>
                    <span className="text-[11px] font-medium text-[#374151] truncate max-w-[120px]">
                      {c.name}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onLoad(c.formData)}
                        className="text-[10px] text-[#6B7280] hover:text-[#111827] transition-colors"
                        title="Load this configuration"
                      >
                        Load
                      </button>
                      <span className="text-[#E5E7EB]">|</span>
                      <button
                        onClick={() => onRemove(c.id)}
                        className="text-[10px] text-[#DC2626] hover:text-[#B91C1C] transition-colors"
                        title="Remove from comparison"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-[#F3F4F6] last:border-0">
                <td className="py-2 pr-3 text-[12px] text-[#6B7280] whitespace-nowrap">
                  {row.label}
                </td>
                {cases.map((c) => {
                  const val = row.getValue(c);
                  const hl = row.highlight?.(c);
                  // For utilization row, highlight best (lowest) and worst (highest)
                  let cellHl = hl;
                  if (row.label === "Utilization" && utilValues.length > 1) {
                    const u = c.result.utilization;
                    if (isFinite(u) && u === minUtil) cellHl = "best";
                    else if (isFinite(u) && u === maxUtil && maxUtil > 1) cellHl = "worst";
                  }
                  return (
                    <td
                      key={c.id}
                      className={cn(
                        "py-2 px-2 text-center text-[12px] font-mono font-medium",
                        cellHl === "best" && "text-[#0D9488] bg-[#F0FDFA]",
                        cellHl === "worst" && "text-[#DC2626] bg-[#FEF2F2]",
                        !cellHl && "text-[#111827]",
                      )}
                    >
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#9CA3AF]">
      {children}
    </span>
  );
}
