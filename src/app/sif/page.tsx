"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { calculateSif, type ComponentType, type SifResult } from "@/lib/engine/sif";
import { cn } from "@/lib/utils";

const COMPONENT_TYPES: { value: ComponentType; label: string; needsExtra: string[] }[] = [
  { value: "bend", label: "Bend / Elbow", needsExtra: ["R"] },
  { value: "closely_spaced_miter", label: "Closely Spaced Miter", needsExtra: ["s"] },
  { value: "widely_spaced_miter", label: "Widely Spaced Miter", needsExtra: ["theta"] },
  { value: "welding_tee", label: "Welding Tee", needsExtra: [] },
  { value: "unreinforced_tee", label: "Unreinforced Fabricated Tee", needsExtra: [] },
  { value: "reinforced_tee", label: "Reinforced Fabricated Tee", needsExtra: ["tr"] },
  { value: "butt_weld", label: "Butt Weld", needsExtra: [] },
  { value: "socket_weld", label: "Socket Weld", needsExtra: [] },
  { value: "threaded_joint", label: "Threaded Joint", needsExtra: [] },
  { value: "weld_neck_flange", label: "Weld Neck Flange", needsExtra: [] },
  { value: "slip_on_flange", label: "Slip-On Flange", needsExtra: [] },
  { value: "lap_joint_flange", label: "Lap Joint Flange", needsExtra: [] },
  { value: "reducer", label: "Reducer", needsExtra: ["alpha"] },
];

export default function SifPage() {
  const [componentType, setComponentType] = useState<ComponentType>("bend");
  const [Do, setDo] = useState(168.3);
  const [tn, setTn] = useState(7.11);
  const [R, setR] = useState(252.45);
  const [s, setS] = useState(50);
  const [theta, setTheta] = useState(22.5);
  const [tr, setTr] = useState(7.11);
  const [alpha, setAlpha] = useState(30);

  const compInfo = COMPONENT_TYPES.find((c) => c.value === componentType)!;

  const { result, error } = useMemo((): { result: SifResult | null; error: string | null } => {
    try {
      if (!Do || !tn) return { result: null, error: null };
      const res = calculateSif(componentType, { Do, tn, R, s, theta, tr, alpha });
      return { result: res, error: null };
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : "Error" };
    }
  }, [componentType, Do, tn, R, s, theta, tr, alpha]);

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-10">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#111827] tracking-[-0.5px]">
              SIF Calculator
            </h1>
            <p className="text-[12px] text-[#9CA3AF]">
              Stress Intensification Factors — ASME B31.3 Appendix D
            </p>
          </div>
          <Link
            href="/"
            className="rounded-[8px] bg-[#111827] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#374151] transition-colors"
          >
            Back to Screening
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Form */}
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <Overline>Component Type</Overline>
              </CardHeader>
              <CardContent>
                <Select value={componentType} onValueChange={(v) => setComponentType(v as ComponentType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMPONENT_TYPES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Overline>Pipe Dimensions</Overline>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FieldGroup label="Outside Diameter (Do)">
                  <Input type="number" value={Do || ""} onChange={(e) => setDo(parseFloat(e.target.value) || 0)} unit="mm" step="0.1" />
                </FieldGroup>
                <FieldGroup label="Wall Thickness (tn)">
                  <Input type="number" value={tn || ""} onChange={(e) => setTn(parseFloat(e.target.value) || 0)} unit="mm" step="0.01" />
                </FieldGroup>
              </CardContent>
            </Card>

            {compInfo.needsExtra.length > 0 && (
              <Card>
                <CardHeader>
                  <Overline>Component Parameters</Overline>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {compInfo.needsExtra.includes("R") && (
                    <FieldGroup label="Bend Radius (R)">
                      <Input type="number" value={R || ""} onChange={(e) => setR(parseFloat(e.target.value) || 0)} unit="mm" step="0.1" />
                    </FieldGroup>
                  )}
                  {compInfo.needsExtra.includes("s") && (
                    <FieldGroup label="Miter Spacing (s)">
                      <Input type="number" value={s || ""} onChange={(e) => setS(parseFloat(e.target.value) || 0)} unit="mm" step="1" />
                    </FieldGroup>
                  )}
                  {compInfo.needsExtra.includes("theta") && (
                    <FieldGroup label="Miter Angle (θ)">
                      <Input type="number" value={theta || ""} onChange={(e) => setTheta(parseFloat(e.target.value) || 0)} unit="deg" step="0.5" />
                    </FieldGroup>
                  )}
                  {compInfo.needsExtra.includes("tr") && (
                    <FieldGroup label="Pad Thickness (tr)">
                      <Input type="number" value={tr || ""} onChange={(e) => setTr(parseFloat(e.target.value) || 0)} unit="mm" step="0.01" />
                    </FieldGroup>
                  )}
                  {compInfo.needsExtra.includes("alpha") && (
                    <FieldGroup label="Cone Half-Angle (α)">
                      <Input type="number" value={alpha || ""} onChange={(e) => setAlpha(parseFloat(e.target.value) || 0)} unit="deg" step="1" />
                    </FieldGroup>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Bend Presets */}
            {componentType === "bend" && (
              <Card>
                <CardHeader>
                  <Overline>Bend Presets</Overline>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Long Radius (1.5D)", factor: 1.5 },
                      { label: "Short Radius (1.0D)", factor: 1.0 },
                      { label: "3D Bend", factor: 3.0 },
                      { label: "5D Bend", factor: 5.0 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => setR(Do * preset.factor)}
                        className={cn(
                          "rounded-[6px] border px-3 py-2 text-[13px] font-medium transition-colors",
                          Math.abs(R - Do * preset.factor) < 0.1
                            ? "border-[#0D9488] bg-[#F0FDFA] text-[#0D9488]"
                            : "border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB]",
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {error ? (
              <Card className="border border-[#DC2626]">
                <CardHeader>
                  <Overline className="text-[#DC2626]">Error</Overline>
                </CardHeader>
                <CardContent>
                  <p className="text-[14px] text-[#B91C1C]">{error}</p>
                </CardContent>
              </Card>
            ) : !result ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-[14px] text-[#6B7280]">Enter dimensions to calculate SIF.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {/* SIF values */}
                <Card>
                  <CardHeader>
                    <Overline>SIF Results</Overline>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <SifBox label="In-plane (iᵢ)" value={result.ii} />
                      <SifBox label="Out-of-plane (iₒ)" value={result.io} />
                      <SifBox label="Flexibility (k)" value={result.k} />
                      <SifBox label="Characteristic (h)" value={result.h} />
                    </div>
                  </CardContent>
                </Card>

                {/* Interpretation */}
                <Card>
                  <CardHeader>
                    <Overline>Interpretation</Overline>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[#6B7280]">Max SIF</span>
                      <Badge variant={Math.max(result.ii, result.io) <= 2.0 ? "pass" : Math.max(result.ii, result.io) <= 5.0 ? "warning" : "fail"}>
                        {Math.max(result.ii, result.io).toFixed(2)}
                      </Badge>
                    </div>
                    <p className="text-[12px] text-[#9CA3AF]">
                      {Math.max(result.ii, result.io) <= 1.0
                        ? "Minimum SIF — equivalent to girth butt weld."
                        : Math.max(result.ii, result.io) <= 2.5
                          ? "Moderate stress concentration. Typical for standard fittings."
                          : Math.max(result.ii, result.io) <= 5.0
                            ? "Significant stress raiser. Consider thicker wall or larger bend radius."
                            : "Very high SIF. Recommend redesigning the component or routing."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SifBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[8px] bg-[#F9FAFB] p-4 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#9CA3AF]">
        {label}
      </p>
      <p className="mt-1 text-[24px] font-bold text-[#111827] leading-none">
        {value.toFixed(2)}
      </p>
    </div>
  );
}

function Overline({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-[10px] font-semibold uppercase tracking-[0.05em] text-[#9CA3AF]", className)}>
      {children}
    </span>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-[6px]">
      <label className="text-[13px] font-medium text-[#374151]">{label}</label>
      {children}
    </div>
  );
}
