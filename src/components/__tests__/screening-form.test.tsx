import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScreeningForm, type FormData } from "../screening-form";

const defaultData: FormData = {
  code: "B31.3",
  material: "Carbon Steel (A106-B)",
  nps: '6"',
  schedule: "Sch 40 (Std)",
  Do: 168.3,
  tn: 7.11,
  T1: 300,
  T2: 20,
  L: 30,
  U: 20,
  yManual: "",
  yAdditional: 0,
};

describe("ScreeningForm", () => {
  it("renders all four section overlines", () => {
    render(
      <ScreeningForm data={defaultData} unitSystem="SI" onChange={() => {}} />,
    );
    expect(screen.getByText("Code & Material")).toBeDefined();
    expect(screen.getByText("Pipe Geometry")).toBeDefined();
    expect(screen.getByText("Operating Conditions")).toBeDefined();
    expect(screen.getByText("Routing Geometry")).toBeDefined();
  });

  it("renders all field labels", () => {
    render(
      <ScreeningForm data={defaultData} unitSystem="SI" onChange={() => {}} />,
    );
    expect(screen.getByText("Piping Code")).toBeDefined();
    expect(screen.getByText("Material")).toBeDefined();
    expect(screen.getByText("Nominal Pipe Size")).toBeDefined();
    expect(screen.getByText("Schedule")).toBeDefined();
    expect(screen.getByText("Outside Diameter")).toBeDefined();
    expect(screen.getByText("Wall Thickness")).toBeDefined();
    expect(screen.getByText("Design Temperature")).toBeDefined();
    expect(screen.getByText("Ambient Temperature")).toBeDefined();
    expect(screen.getByText("Developed Length (L)")).toBeDefined();
    expect(screen.getByText("Anchor Distance (U)")).toBeDefined();
  });

  it("shows SI units when unitSystem is SI", () => {
    const { container } = render(
      <ScreeningForm data={defaultData} unitSystem="SI" onChange={() => {}} />,
    );
    const unitSpans = container.querySelectorAll("span");
    const unitTexts = Array.from(unitSpans).map((s) => s.textContent);
    expect(unitTexts).toContain("mm");
    expect(unitTexts).toContain("°C");
    expect(unitTexts).toContain("m");
  });

  it("shows Imperial units when unitSystem is Imperial", () => {
    const { container } = render(
      <ScreeningForm data={defaultData} unitSystem="Imperial" onChange={() => {}} />,
    );
    const unitSpans = container.querySelectorAll("span");
    const unitTexts = Array.from(unitSpans).map((s) => s.textContent);
    expect(unitTexts).toContain("in");
    expect(unitTexts).toContain("°F");
    expect(unitTexts).toContain("ft");
  });

  it("calls onChange when a numeric field is modified", () => {
    const onChange = vi.fn();
    render(
      <ScreeningForm data={defaultData} unitSystem="SI" onChange={onChange} />,
    );

    // Find the Design Temperature input (T1 = 300)
    const t1Input = screen.getByDisplayValue("300");
    fireEvent.change(t1Input, { target: { value: "350" } });

    expect(onChange).toHaveBeenCalled();
    const newData = onChange.mock.calls[0][0] as FormData;
    expect(newData.T1).toBe(350);
  });

  it("updates Do and tn when L field changes", () => {
    const onChange = vi.fn();
    render(
      <ScreeningForm data={defaultData} unitSystem="SI" onChange={onChange} />,
    );

    // Find L input (value = 30)
    const lInput = screen.getByDisplayValue("30");
    fireEvent.change(lInput, { target: { value: "45" } });

    expect(onChange).toHaveBeenCalled();
    const newData = onChange.mock.calls[0][0] as FormData;
    expect(newData.L).toBe(45);
    // Do and tn should remain unchanged
    expect(newData.Do).toBe(168.3);
    expect(newData.tn).toBe(7.11);
  });
});
