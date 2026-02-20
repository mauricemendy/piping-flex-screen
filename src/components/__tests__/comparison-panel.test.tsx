import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComparisonPanel, type ComparisonCase } from "../comparison-panel";
import { type ScreeningResult } from "@/lib/engine/calculator";
import { type FormData } from "@/components/screening-form";

const makeCase = (
  overrides: Partial<{
    id: string;
    name: string;
    pass: boolean;
    utilization: number;
    nps: string;
    T1: number;
    material: string;
  }> = {},
): ComparisonCase => {
  const pass = overrides.pass ?? true;
  const formData: FormData = {
    code: "B31.3",
    material: overrides.material ?? "Carbon Steel (A106-B)",
    nps: overrides.nps ?? '6"',
    schedule: "Sch 40 (Std)",
    Do: 168.3,
    tn: 7.11,
    T1: overrides.T1 ?? 300,
    T2: 20,
    L: 30,
    U: 20,
    yManual: "",
    yAdditional: 0,
  };

  const result: ScreeningResult = {
    analysisRequired: !pass,
    ratio: pass ? 120.5 : 350,
    K1: 208,
    utilization: overrides.utilization ?? (pass ? 0.58 : 1.68),
    thermalExpansion: 3.65,
    y: 73.0,
    effectiveLength: 10.0,
    Ec: 187500,
    Ea: 203400,
    Sh: 137.9,
    Sc: 137.9,
    SA: 206.85,
    code: "B31.3",
    message: pass ? "PASSES" : "FAILS",
  };

  return {
    id: overrides.id ?? "case-1",
    name: overrides.name ?? '6" CS @ 300°C',
    formData,
    result,
  };
};

describe("ComparisonPanel", () => {
  const noop = () => {};

  it("shows empty state when no cases", () => {
    render(
      <ComparisonPanel cases={[]} onRemove={noop} onLoad={noop} onClear={noop} />,
    );
    expect(screen.getByText("No Cases to Compare")).toBeDefined();
  });

  it("renders a single case with PASS badge", () => {
    const cases = [makeCase({ pass: true })];
    render(
      <ComparisonPanel cases={cases} onRemove={noop} onLoad={noop} onClear={noop} />,
    );
    expect(screen.getByText("PASS")).toBeDefined();
    expect(screen.getByText('6" CS @ 300°C')).toBeDefined();
    expect(screen.getByText("Comparison (1 cases)")).toBeDefined();
  });

  it("renders multiple cases side by side", () => {
    const cases = [
      makeCase({ id: "a", name: "Case A", pass: true }),
      makeCase({ id: "b", name: "Case B", pass: false }),
    ];
    render(
      <ComparisonPanel cases={cases} onRemove={noop} onLoad={noop} onClear={noop} />,
    );
    expect(screen.getByText("Case A")).toBeDefined();
    expect(screen.getByText("Case B")).toBeDefined();
    expect(screen.getAllByText("PASS").length).toBe(1);
    expect(screen.getAllByText("FAIL").length).toBe(1);
    expect(screen.getByText("Comparison (2 cases)")).toBeDefined();
  });

  it("calls onRemove when Remove is clicked", () => {
    const onRemove = vi.fn();
    const cases = [makeCase({ id: "x" })];
    render(
      <ComparisonPanel cases={cases} onRemove={onRemove} onLoad={noop} onClear={noop} />,
    );
    fireEvent.click(screen.getByText("Remove"));
    expect(onRemove).toHaveBeenCalledWith("x");
  });

  it("calls onLoad when Load is clicked", () => {
    const onLoad = vi.fn();
    const c = makeCase();
    render(
      <ComparisonPanel cases={[c]} onRemove={noop} onLoad={onLoad} onClear={noop} />,
    );
    fireEvent.click(screen.getByText("Load"));
    expect(onLoad).toHaveBeenCalledWith(c.formData);
  });

  it("calls onClear when Clear All is clicked", () => {
    const onClear = vi.fn();
    const cases = [makeCase()];
    render(
      <ComparisonPanel cases={cases} onRemove={noop} onLoad={noop} onClear={onClear} />,
    );
    fireEvent.click(screen.getByText("Clear All"));
    expect(onClear).toHaveBeenCalled();
  });

  it("displays parameter rows", () => {
    const cases = [makeCase()];
    render(
      <ComparisonPanel cases={cases} onRemove={noop} onLoad={noop} onClear={noop} />,
    );
    // Check key parameter labels exist
    expect(screen.getByText("Code")).toBeDefined();
    expect(screen.getByText("Material")).toBeDefined();
    expect(screen.getByText("NPS")).toBeDefined();
    expect(screen.getByText("T design")).toBeDefined();
    expect(screen.getByText("Utilization")).toBeDefined();
    expect(screen.getByText("Ratio")).toBeDefined();
    expect(screen.getByText("SA")).toBeDefined();
  });

  it("shows utilization values", () => {
    const cases = [
      makeCase({ id: "lo", name: "Low", utilization: 0.4, pass: true }),
      makeCase({ id: "hi", name: "High", utilization: 1.5, pass: false }),
    ];
    render(
      <ComparisonPanel cases={cases} onRemove={noop} onLoad={noop} onClear={noop} />,
    );
    expect(screen.getByText("40%")).toBeDefined();
    expect(screen.getByText("150%")).toBeDefined();
  });
});
