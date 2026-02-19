import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultPanel } from "../result-panel";
import { type ScreeningResult } from "@/lib/engine/calculator";

// Mock the 3D viewer since it requires WebGL
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    const MockComponent = () => <div data-testid="mock-pipe-viewer">3D Viewer</div>;
    MockComponent.displayName = "MockDynamic";
    return MockComponent;
  },
}));

const passingResult: ScreeningResult = {
  analysisRequired: false,
  ratio: 120.5,
  K1: 208,
  utilization: 0.58,
  thermalExpansion: 3.65,
  y: 73.0,
  effectiveLength: 10.0,
  Ec: 187500,
  Ea: 203400,
  Sh: 137.9,
  Sc: 137.9,
  SA: 206.85,
  code: "B31.3",
  message: "Screening PASSES",
};

const failingResult: ScreeningResult = {
  ...passingResult,
  analysisRequired: true,
  ratio: 350.0,
  utilization: 1.68,
  message: "Screening FAILS",
};

describe("ResultPanel", () => {
  it("shows placeholder when no result and no error", () => {
    render(<ResultPanel result={null} error={null} L={30} U={20} Do={168.3} />);
    expect(screen.getByText("Screening Results")).toBeDefined();
    expect(screen.getByText("Fill in the parameters to run the check.")).toBeDefined();
  });

  it("shows error when error prop is set", () => {
    render(
      <ResultPanel result={null} error="Developed length L must be positive" L={0} U={20} Do={168.3} />,
    );
    expect(screen.getByText("Developed length L must be positive")).toBeDefined();
  });

  it("shows PASS verdict for passing result", () => {
    render(<ResultPanel result={passingResult} error={null} L={30} U={20} Do={168.3} />);
    expect(screen.getByText("PASS")).toBeDefined();
    expect(screen.getByText("No Analysis Req.")).toBeDefined();
    expect(
      screen.getByText(/Formal flexibility analysis is NOT required/),
    ).toBeDefined();
  });

  it("shows FAIL verdict for failing result", () => {
    render(<ResultPanel result={failingResult} error={null} L={30} U={20} Do={168.3} />);
    expect(screen.getByText("FAIL")).toBeDefined();
    expect(screen.getByText("Analysis Required")).toBeDefined();
    expect(
      screen.getByText(/Formal flexibility analysis IS required/),
    ).toBeDefined();
  });

  it("shows utilization percentage", () => {
    render(<ResultPanel result={passingResult} error={null} L={30} U={20} Do={168.3} />);
    expect(screen.getByText("58%")).toBeDefined();
  });

  it("shows material properties", () => {
    render(<ResultPanel result={passingResult} error={null} L={30} U={20} Do={168.3} />);
    expect(screen.getByText("203400 MPa")).toBeDefined(); // Ea
    expect(screen.getByText("187500 MPa")).toBeDefined(); // Ec
    expect(screen.getByText("206.8 MPa")).toBeDefined();  // SA
  });

  it("shows recommendation card only when failing", () => {
    const { container: passContainer } = render(
      <ResultPanel result={passingResult} error={null} L={30} U={20} Do={168.3} />,
    );
    expect(passContainer.textContent).not.toContain("Recommendation");

    const { container: failContainer } = render(
      <ResultPanel result={failingResult} error={null} L={30} U={20} Do={168.3} />,
    );
    expect(failContainer.textContent).toContain("To pass screening");
  });
});
