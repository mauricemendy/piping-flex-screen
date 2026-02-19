"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ScreeningForm, type FormData } from "@/components/screening-form";
import { ResultPanel } from "@/components/result-panel";
import { UnitToggle } from "@/components/unit-toggle";
import { performScreening, type ScreeningResult } from "@/lib/engine/calculator";
import { type UnitSystem } from "@/lib/engine/units";
import { PIPE_SIZES } from "@/lib/engine/pipe-data";

const defaultPipe = PIPE_SIZES[7]; // 6"
const defaultSchedule = defaultPipe.schedules[2]; // Sch 40

const defaultFormData: FormData = {
  code: "B31.3",
  material: "Carbon Steel (A106-B)",
  nps: defaultPipe.nps,
  schedule: defaultSchedule.name,
  Do: defaultPipe.Do,
  tn: defaultSchedule.tn,
  T1: 300,
  T2: 20,
  L: 30,
  U: 20,
  yManual: "",
  yAdditional: 0,
};

export default function Home() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("SI");
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const { result, error } = useMemo((): {
    result: ScreeningResult | null;
    error: string | null;
  } => {
    try {
      if (!formData.Do || !formData.tn || !formData.L || !formData.U) {
        return { result: null, error: null };
      }

      const input = {
        code: formData.code,
        material: formData.material,
        Do: formData.Do,
        tn: formData.tn,
        T1: formData.T1,
        T2: formData.T2,
        L: formData.L,
        U: formData.U,
        y: formData.yManual ? parseFloat(formData.yManual) : undefined,
        yAdditional: formData.yAdditional,
      };

      return { result: performScreening(input), error: null };
    } catch (err) {
      return {
        result: null,
        error: err instanceof Error ? err.message : "Calculation error",
      };
    }
  }, [formData]);

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-10">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#111827] tracking-[-0.5px]">
              Flex Screen
            </h1>
            <p className="text-[12px] text-[#9CA3AF]">
              ASME {formData.code} §319.4.1 Flexibility Screening
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sif"
              className="rounded-[8px] border border-[#E5E7EB] bg-white px-4 py-2 text-[14px] font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
            >
              SIF Calculator
            </Link>
            <UnitToggle value={unitSystem} onChange={setUnitSystem} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left: Form */}
          <div>
            <ScreeningForm
              data={formData}
              unitSystem={unitSystem}
              onChange={setFormData}
            />
          </div>

          {/* Right: Results (sticky on desktop) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ResultPanel result={result} error={error} L={formData.L} U={formData.U} Do={formData.Do} />
          </div>
        </div>
      </main>
    </div>
  );
}
