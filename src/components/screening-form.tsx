"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getAvailableMaterials, type PipingCode } from "@/lib/engine/calculator";
import { PIPE_SIZES } from "@/lib/engine/pipe-data";
import { unitLabel, type UnitSystem } from "@/lib/engine/units";

export interface FormData {
  code: PipingCode;
  material: string;
  nps: string;
  schedule: string;
  Do: number;
  tn: number;
  T1: number;
  T2: number;
  L: number;
  U: number;
  yManual: string;
  yAdditional: number;
}

interface ScreeningFormProps {
  data: FormData;
  unitSystem: UnitSystem;
  onChange: (data: FormData) => void;
}

const materials = getAvailableMaterials();
const codes: PipingCode[] = ["B31.3", "B31.1"];

export function ScreeningForm({ data, unitSystem, onChange }: ScreeningFormProps) {
  const selectedPipe = PIPE_SIZES.find((p) => p.nps === data.nps);
  const schedules = selectedPipe?.schedules ?? [];

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    onChange({ ...data, [key]: value });
  }

  function handlePipeChange(nps: string) {
    const pipe = PIPE_SIZES.find((p) => p.nps === nps);
    if (!pipe) return;
    const sch = pipe.schedules[0];
    onChange({
      ...data,
      nps,
      schedule: sch?.name ?? "",
      Do: pipe.Do,
      tn: sch?.tn ?? 0,
    });
  }

  function handleScheduleChange(schName: string) {
    const sch = selectedPipe?.schedules.find((s) => s.name === schName);
    if (!sch) return;
    onChange({
      ...data,
      schedule: schName,
      tn: sch.tn,
    });
  }

  return (
    <div className="grid gap-6">
      {/* Code & Material */}
      <Card>
        <CardHeader>
          <Overline>Code & Material</Overline>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Piping Code">
            <Select value={data.code} onValueChange={(v) => updateField("code", v as PipingCode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {codes.map((c) => (
                  <SelectItem key={c} value={c}>ASME {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label="Material">
            <Select value={data.material} onValueChange={(v) => updateField("material", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Pipe Geometry */}
      <Card>
        <CardHeader>
          <Overline>Pipe Geometry</Overline>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Nominal Pipe Size">
            <Select value={data.nps} onValueChange={handlePipeChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PIPE_SIZES.map((p) => (
                  <SelectItem key={p.nps} value={p.nps}>
                    NPS {p.nps} (OD {p.Do} mm)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label="Schedule">
            <Select value={data.schedule} onValueChange={handleScheduleChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {schedules.map((s) => (
                  <SelectItem key={s.name} value={s.name}>
                    {s.name} (t={s.tn} mm)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label="Outside Diameter">
            <Input
              type="number"
              value={data.Do || ""}
              onChange={(e) => updateField("Do", parseFloat(e.target.value) || 0)}
              unit={unitLabel("diameter", unitSystem)}
              step="0.1"
            />
          </FieldGroup>

          <FieldGroup label="Wall Thickness">
            <Input
              type="number"
              value={data.tn || ""}
              onChange={(e) => updateField("tn", parseFloat(e.target.value) || 0)}
              unit={unitLabel("thickness", unitSystem)}
              step="0.01"
            />
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Operating Conditions */}
      <Card>
        <CardHeader>
          <Overline>Operating Conditions</Overline>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Design Temperature">
            <Input
              type="number"
              value={data.T1 || ""}
              onChange={(e) => updateField("T1", parseFloat(e.target.value) || 0)}
              unit={unitLabel("temperature", unitSystem)}
            />
          </FieldGroup>

          <FieldGroup label="Ambient Temperature">
            <Input
              type="number"
              value={data.T2 || ""}
              onChange={(e) => updateField("T2", parseFloat(e.target.value) || 0)}
              unit={unitLabel("temperature", unitSystem)}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Routing Geometry */}
      <Card>
        <CardHeader>
          <Overline>Routing Geometry</Overline>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Developed Length (L)">
            <Input
              type="number"
              value={data.L || ""}
              onChange={(e) => updateField("L", parseFloat(e.target.value) || 0)}
              unit={unitLabel("length", unitSystem)}
              step="0.1"
            />
          </FieldGroup>

          <FieldGroup label="Anchor Distance (U)">
            <Input
              type="number"
              value={data.U || ""}
              onChange={(e) => updateField("U", parseFloat(e.target.value) || 0)}
              unit={unitLabel("length", unitSystem)}
              step="0.1"
            />
          </FieldGroup>

          <FieldGroup label="Displacement Override (y)">
            <Input
              type="number"
              value={data.yManual}
              onChange={(e) => updateField("yManual", e.target.value)}
              unit={unitLabel("diameter", unitSystem)}
              placeholder="Auto (thermal)"
              step="0.1"
            />
          </FieldGroup>

          <FieldGroup label="Additional Displacement">
            <Input
              type="number"
              value={data.yAdditional || ""}
              onChange={(e) => updateField("yAdditional", parseFloat(e.target.value) || 0)}
              unit={unitLabel("diameter", unitSystem)}
              placeholder="0"
              step="0.1"
            />
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#9CA3AF]">
      {children}
    </span>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-[6px]">
      <label className="text-[13px] font-medium text-[#374151]">
        {label}
      </label>
      {children}
    </div>
  );
}
