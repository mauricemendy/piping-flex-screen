import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UnitToggle } from "../unit-toggle";

describe("UnitToggle", () => {
  it("renders SI and Imperial buttons", () => {
    render(<UnitToggle value="SI" onChange={() => {}} />);
    expect(screen.getByText("SI (Metric)")).toBeDefined();
    expect(screen.getByText("Imperial")).toBeDefined();
  });

  it("calls onChange with 'Imperial' when Imperial is clicked", () => {
    const onChange = vi.fn();
    render(<UnitToggle value="SI" onChange={onChange} />);
    fireEvent.click(screen.getByText("Imperial"));
    expect(onChange).toHaveBeenCalledWith("Imperial");
  });

  it("calls onChange with 'SI' when SI is clicked", () => {
    const onChange = vi.fn();
    render(<UnitToggle value="Imperial" onChange={onChange} />);
    fireEvent.click(screen.getByText("SI (Metric)"));
    expect(onChange).toHaveBeenCalledWith("SI");
  });
});
