"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type ScreeningResult } from "@/lib/engine/calculator";
import { cn } from "@/lib/utils";

interface ResultPanelProps {
  result: ScreeningResult | null;
  error: string | null;
}

export function ResultPanel({ result, error }: ResultPanelProps) {
  if (error) {
    return (
      <Card className="border border-[#DC2626]">
        <CardHeader>
          <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#DC2626]">
            Input Error
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-[14px] text-[#B91C1C]">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F4F6]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20V10"/>
              <path d="M18 20V4"/>
              <path d="M6 20v-4"/>
            </svg>
          </div>
          <p className="text-[16px] font-semibold text-[#111827]">Screening Results</p>
          <p className="mt-1 text-[14px] text-[#6B7280]">Fill in the parameters to run the check.</p>
        </CardContent>
      </Card>
    );
  }

  const pass = !result.analysisRequired;
  const utilPct = Math.min(result.utilization * 100, 999);

  return (
    <div className="grid gap-6">
      {/* Verdict card */}
      <Card className={cn(
        "border",
        pass ? "border-[#0D9488]" : "border-[#DC2626]",
      )}>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#9CA3AF]">
              Screening Result
            </span>
            <p className={cn(
              "mt-1 text-[28px] font-bold leading-none",
              pass ? "text-[#0D9488]" : "text-[#DC2626]",
            )}>
              {pass ? "PASS" : "FAIL"}
            </p>
          </div>
          <Badge variant={pass ? "pass" : "fail"}>
            {pass ? "No Analysis Req." : "Analysis Required"}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className={cn(
            "text-[13px]",
            pass ? "text-[#0F766E]" : "text-[#B91C1C]",
          )}>
            {pass
              ? "Formal flexibility analysis is NOT required per the screening criterion."
              : "Formal flexibility analysis IS required. The system exceeds the screening limit."}
          </p>

          {/* Utilization bar */}
          <div className="grid gap-2">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#9CA3AF]">
                Utilization
              </span>
              <span className="text-[24px] font-bold text-[#111827] leading-none">
                {result.utilization === Infinity ? "---" : `${utilPct.toFixed(0)}%`}
              </span>
            </div>
            <div className="h-2 w-full rounded-[4px] bg-[#E5E7EB] overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-[4px] transition-all duration-500",
                  utilPct <= 70
                    ? "bg-[#0D9488]"
                    : utilPct <= 100
                      ? "bg-[#D97706]"
                      : "bg-[#DC2626]",
                )}
                style={{ width: `${Math.min(utilPct, 100)}%` }}
              />
            </div>
            <p className="text-[12px] text-[#6B7280] font-mono">
              D&middot;y / (L&minus;U)&sup2; = {result.ratio === Infinity ? "\u221E" : result.ratio.toFixed(1)}{" "}
              &le; K&#x2081; = {result.K1}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Parameters card */}
      <Card>
        <CardHeader>
          <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#9CA3AF]">
            Screening Parameters
          </span>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3">
            <DetailRow label="Total displacement y" value={`${result.y.toFixed(1)} mm`} />
            <DetailRow label="Thermal expansion" value={`${result.thermalExpansion.toFixed(2)} mm/m`} />
            <DetailRow label="Effective length (L-U)" value={`${result.effectiveLength.toFixed(1)} m`} />
            <DetailRow
              label="Screening ratio"
              value={result.ratio === Infinity ? "\u221E" : result.ratio.toFixed(1)}
            />
            <DetailRow label="K\u2081 threshold" value={result.K1.toString()} />
          </dl>
        </CardContent>
      </Card>

      {/* Material properties card */}
      <Card>
        <CardHeader>
          <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#9CA3AF]">
            Material Properties
          </span>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3">
            <DetailRow label="E (ambient)" value={`${result.Ea.toFixed(0)} MPa`} />
            <DetailRow label="E (design)" value={`${result.Ec.toFixed(0)} MPa`} />
            <DetailRow label="Sc (ambient)" value={`${result.Sc.toFixed(1)} MPa`} />
            <DetailRow label="Sh (design)" value={`${result.Sh.toFixed(1)} MPa`} />
            <DetailRow
              label="SA (allowable range)"
              value={`${result.SA.toFixed(1)} MPa`}
              highlight
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-2 last:border-0 last:pb-0">
      <dt className="text-[13px] text-[#6B7280]">{label}</dt>
      <dd className={cn(
        "text-[13px] font-semibold font-mono",
        highlight ? "text-[#0D9488]" : "text-[#111827]",
      )}>
        {value}
      </dd>
    </div>
  );
}
