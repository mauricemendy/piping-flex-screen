import { describe, it, expect } from "vitest";
import {
  siToImperial,
  imperialToSi,
  convert,
  unitLabel,
  convertDeltaT,
  convertExpansionRate,
  EXPANSION_SI_TO_IMP,
} from "../units";

describe("units", () => {
  describe("siToImperial", () => {
    it("converts temperature °C → °F", () => {
      expect(siToImperial(0, "temperature")).toBeCloseTo(32, 1);
      expect(siToImperial(100, "temperature")).toBeCloseTo(212, 1);
      expect(siToImperial(-40, "temperature")).toBeCloseTo(-40, 1);
      expect(siToImperial(20, "temperature")).toBeCloseTo(68, 1);
    });

    it("converts length m → ft", () => {
      expect(siToImperial(1, "length")).toBeCloseTo(3.28084, 3);
      expect(siToImperial(10, "length")).toBeCloseTo(32.8084, 2);
    });

    it("converts diameter mm → in", () => {
      expect(siToImperial(25.4, "diameter")).toBeCloseTo(1.0, 2);
      expect(siToImperial(168.3, "diameter")).toBeCloseTo(6.626, 1);
    });

    it("converts thickness mm → in", () => {
      expect(siToImperial(25.4, "thickness")).toBeCloseTo(1.0, 2);
    });

    it("converts pressure MPa → psi", () => {
      expect(siToImperial(1, "pressure")).toBeCloseTo(145.038, 0);
      expect(siToImperial(10, "pressure")).toBeCloseTo(1450.38, 0);
    });

    it("converts stress MPa → psi", () => {
      expect(siToImperial(137.9, "stress")).toBeCloseTo(20000, -2);
    });

    it("converts force N → lbf", () => {
      expect(siToImperial(4.44822, "force")).toBeCloseTo(1.0, 1);
    });

    it("converts moment N·m → lbf·ft", () => {
      expect(siToImperial(1.35582, "moment")).toBeCloseTo(1.0, 1);
    });

    it("converts modulus (same as stress)", () => {
      expect(siToImperial(200000, "modulus")).toBeCloseTo(29007600, -3);
    });
  });

  describe("imperialToSi", () => {
    it("converts temperature °F → °C", () => {
      expect(imperialToSi(32, "temperature")).toBeCloseTo(0, 1);
      expect(imperialToSi(212, "temperature")).toBeCloseTo(100, 1);
      expect(imperialToSi(-40, "temperature")).toBeCloseTo(-40, 1);
    });

    it("converts length ft → m", () => {
      expect(imperialToSi(3.28084, "length")).toBeCloseTo(1.0, 2);
    });

    it("converts diameter in → mm", () => {
      expect(imperialToSi(1.0, "diameter")).toBeCloseTo(25.4, 0);
    });

    it("converts pressure psi → MPa", () => {
      expect(imperialToSi(145.038, "pressure")).toBeCloseTo(1.0, 2);
    });
  });

  describe("convert", () => {
    it("returns value unchanged when from === to", () => {
      expect(convert(100, "temperature", "SI", "SI")).toBe(100);
      expect(convert(100, "temperature", "Imperial", "Imperial")).toBe(100);
      expect(convert(42, "length", "SI", "SI")).toBe(42);
    });

    it("converts SI → Imperial", () => {
      expect(convert(100, "temperature", "SI", "Imperial")).toBeCloseTo(212, 1);
    });

    it("converts Imperial → SI", () => {
      expect(convert(212, "temperature", "Imperial", "SI")).toBeCloseTo(100, 1);
    });

    it("round-trips correctly", () => {
      const original = 350;
      const toImp = convert(original, "temperature", "SI", "Imperial");
      const backToSi = convert(toImp, "temperature", "Imperial", "SI");
      expect(backToSi).toBeCloseTo(original, 5);
    });
  });

  describe("unitLabel", () => {
    it("returns correct SI labels", () => {
      expect(unitLabel("length", "SI")).toBe("m");
      expect(unitLabel("diameter", "SI")).toBe("mm");
      expect(unitLabel("temperature", "SI")).toBe("°C");
      expect(unitLabel("pressure", "SI")).toBe("MPa");
      expect(unitLabel("stress", "SI")).toBe("MPa");
    });

    it("returns correct Imperial labels", () => {
      expect(unitLabel("length", "Imperial")).toBe("ft");
      expect(unitLabel("diameter", "Imperial")).toBe("in");
      expect(unitLabel("temperature", "Imperial")).toBe("°F");
      expect(unitLabel("pressure", "Imperial")).toBe("psi");
      expect(unitLabel("stress", "Imperial")).toBe("psi");
    });
  });

  describe("convertDeltaT", () => {
    it("returns unchanged when from === to", () => {
      expect(convertDeltaT(100, "SI", "SI")).toBe(100);
    });

    it("converts ΔT from °C to °F (scale only, no offset)", () => {
      expect(convertDeltaT(100, "SI", "Imperial")).toBeCloseTo(180, 1);
      expect(convertDeltaT(1, "SI", "Imperial")).toBeCloseTo(1.8, 2);
    });

    it("converts ΔT from °F to °C", () => {
      expect(convertDeltaT(180, "Imperial", "SI")).toBeCloseTo(100, 1);
    });
  });

  describe("convertExpansionRate", () => {
    it("returns unchanged when from === to", () => {
      expect(convertExpansionRate(5.0, "SI", "SI")).toBe(5.0);
    });

    it("converts mm/m → in/100ft", () => {
      expect(convertExpansionRate(1.0, "SI", "Imperial")).toBeCloseTo(
        EXPANSION_SI_TO_IMP,
        2,
      );
    });

    it("converts in/100ft → mm/m", () => {
      expect(convertExpansionRate(EXPANSION_SI_TO_IMP, "Imperial", "SI")).toBeCloseTo(
        1.0,
        2,
      );
    });
  });
});
