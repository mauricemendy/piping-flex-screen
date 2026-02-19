"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type ScreeningResult, minimumDevelopedLength } from "@/lib/engine/calculator";
import { type FormData } from "@/components/screening-form";
import { cn } from "@/lib/utils";

const PipeRouteViewer = dynamic(
  () => import("@/components/pipe-route-viewer").then((m) => m.PipeRouteViewer),
  { ssr: false, loading: () => <div className="h-[240px] w-full rounded-[12px] bg-[#FAFAFA] border border-[#E5E7EB] animate-pulse" /> },
);

interface ResultPanelProps {
  result: ScreeningResult | null;
  error: string | null;
  L: number;
  U: number;
  Do: number;
  formData?: FormData;
}

export function ResultPanel({ result, error, L, U, Do, formData }: ResultPanelProps) {
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
  const Lmin = minimumDevelopedLength(Do, result.y, U);

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
          <div className="flex items-center gap-2">
            <Badge variant={pass ? "pass" : "fail"}>
              {pass ? "No Analysis Req." : "Analysis Required"}
            </Badge>
            {formData && (
              <button
                onClick={() => {
                  import("@/lib/pdf/generate-report").then(({ generateScreeningPDF }) => {
                    generateScreeningPDF(formData, result);
                  });
                }}
                className="inline-flex items-center gap-1 rounded-[4px] border border-[#E5E7EB] bg-white px-2 py-1 text-[10px] font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                title="Export PDF report"
              >
                <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 1.5V10.5M7.5 10.5L4 7M7.5 10.5L11 7M2 13.5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                PDF
              </button>
            )}
          </div>
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

      {/* 3D Pipe Route Visualization */}
      <Card>
        <CardHeader>
          <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#9CA3AF]">
            Pipe Route
          </span>
        </CardHeader>
        <CardContent>
          <PipeRouteViewer L={L} U={U} pass={pass} />
        </CardContent>
      </Card>

      {/* Minimum length recommendation (only when failing) */}
      {!pass && result.y > 0 && (
        <Card className="border border-[#D97706]">
          <CardHeader>
            <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#D97706]">
              Recommendation
            </span>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-[13px] text-[#374151]">
              To pass screening, increase the developed length to at least:
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold text-[#D97706] leading-none">
                {Lmin.toFixed(1)}
              </span>
              <span className="text-[14px] text-[#6B7280]">m (minimum L)</span>
            </div>
            <p className="text-[12px] text-[#9CA3AF]">
              Current: L = {L.toFixed(1)} m — need {(Lmin - L).toFixed(1)} m more developed length.
            </p>
          </CardContent>
        </Card>
      )}

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
            {!pass && <DetailRow label="Min. developed length" value={`${Lmin.toFixed(1)} m`} highlight />}
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
