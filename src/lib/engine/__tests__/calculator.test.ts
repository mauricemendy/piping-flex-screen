import { describe, it, expect } from "vitest";
import {
  performScreening,
  passesScreening,
  estimateThermalDisplacement,
  allowableStressRange,
  minimumDevelopedLength,
  getAvailableMaterials,
  K1_SI,
  K1_IMPERIAL,
  YOUNGS_MODULUS_TABLES,
  THERMAL_EXPANSION_TABLES,
  ALLOWABLE_STRESS_TABLES,
  type ScreeningInput,
} from "../calculator";

describe("calculator", () => {
  // Common test case: 6" CS pipe, 300°C, L=30m, U=20m
  const baseInput: ScreeningInput = {
    code: "B31.3",
    material: "Carbon Steel (A106-B)",
    Do: 168.3, // 6" nominal OD in mm
    tn: 7.11, // Sch 40 wall thickness
    T1: 300, // Design temperature °C
    T2: 20, // Ambient temperature °C
    L: 30, // Developed length in m
    U: 20, // Anchor-to-anchor distance in m
  };

  describe("getAvailableMaterials", () => {
    it("returns a non-empty list of material names", () => {
      const materials = getAvailableMaterials();
      expect(materials.length).toBeGreaterThan(0);
      expect(materials).toContain("Carbon Steel (A106-B)");
      expect(materials).toContain("304 Stainless Steel");
      expect(materials).toContain("316 Stainless Steel");
      expect(materials).toContain("Chrome-Moly (A335-P11)");
    });
  });

  describe("data tables", () => {
    it("Young's modulus tables have correct structure", () => {
      for (const [name, table] of Object.entries(YOUNGS_MODULUS_TABLES)) {
        expect(table.length).toBeGreaterThan(0);
        // Should be sorted by temperature
        for (let i = 1; i < table.length; i++) {
          expect(table[i].temperature).toBeGreaterThan(table[i - 1].temperature);
        }
        // All values should be positive (modulus in MPa)
        for (const pt of table) {
          expect(pt.value).toBeGreaterThan(0);
        }
        // E should decrease with temperature
        expect(table[0].value).toBeGreaterThan(table[table.length - 1].value);
      }
    });

    it("thermal expansion tables start at 0 for ambient", () => {
      for (const [name, table] of Object.entries(THERMAL_EXPANSION_TABLES)) {
        // First entry should be at or near ambient with value ~0
        expect(table[0].value).toBeCloseTo(0, 1);
        // Expansion should increase with temperature
        expect(table[table.length - 1].value).toBeGreaterThan(0);
      }
    });

    it("allowable stress tables have positive values", () => {
      for (const [name, table] of Object.entries(ALLOWABLE_STRESS_TABLES)) {
        for (const pt of table) {
          expect(pt.value).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("estimateThermalDisplacement", () => {
    it("returns 0 displacement when T1 = T2", () => {
      const y = estimateThermalDisplacement(
        "Carbon Steel (A106-B)",
        20,
        20,
        20,
      );
      expect(y).toBe(0);
    });

    it("returns positive displacement for hot pipe", () => {
      const y = estimateThermalDisplacement(
        "Carbon Steel (A106-B)",
        300,
        20,
        20,
      );
      expect(y).toBeGreaterThan(0);
      // At 300°C, CS expansion ≈ 3.65 mm/m → y ≈ 3.65 * 20 = 73 mm
      expect(y).toBeCloseTo(73.0, 0);
    });

    it("scales linearly with anchor distance", () => {
      const y10 = estimateThermalDisplacement("Carbon Steel (A106-B)", 300, 20, 10);
      const y20 = estimateThermalDisplacement("Carbon Steel (A106-B)", 300, 20, 20);
      expect(y20).toBeCloseTo(2 * y10, 1);
    });

    it("stainless steel expands more than carbon steel", () => {
      const cs = estimateThermalDisplacement("Carbon Steel (A106-B)", 300, 20, 10);
      const ss = estimateThermalDisplacement("304 Stainless Steel", 300, 20, 10);
      expect(ss).toBeGreaterThan(cs);
    });

    it("throws for unknown material", () => {
      expect(() =>
        estimateThermalDisplacement("Unobtanium", 300, 20, 10),
      ).toThrow("Unknown material");
    });
  });

  describe("allowableStressRange", () => {
    it("calculates SA = f(1.25Sc + 0.25Sh) with f=1.0", () => {
      const Sc = 137.9; // MPa
      const Sh = 137.9; // MPa
      // SA = 1.0 * (1.25 * 137.9 + 0.25 * 137.9) = 1.5 * 137.9 = 206.85
      expect(allowableStressRange(Sc, Sh)).toBeCloseTo(206.85, 1);
    });

    it("accounts for different Sc and Sh", () => {
      const Sc = 137.9;
      const Sh = 95.1; // Lower at high temperature
      // SA = 1.25 * 137.9 + 0.25 * 95.1 = 172.375 + 23.775 = 196.15
      expect(allowableStressRange(Sc, Sh)).toBeCloseTo(196.15, 1);
    });

    it("applies stress range reduction factor", () => {
      const Sc = 137.9;
      const Sh = 137.9;
      const f = 0.8; // High cycle
      const base = allowableStressRange(Sc, Sh, 1.0);
      expect(allowableStressRange(Sc, Sh, f)).toBeCloseTo(base * f, 1);
    });
  });

  describe("performScreening", () => {
    it("returns a complete result object", () => {
      const result = performScreening(baseInput);

      expect(result).toHaveProperty("analysisRequired");
      expect(result).toHaveProperty("ratio");
      expect(result).toHaveProperty("K1");
      expect(result).toHaveProperty("utilization");
      expect(result).toHaveProperty("thermalExpansion");
      expect(result).toHaveProperty("y");
      expect(result).toHaveProperty("effectiveLength");
      expect(result).toHaveProperty("Ec");
      expect(result).toHaveProperty("Ea");
      expect(result).toHaveProperty("Sh");
      expect(result).toHaveProperty("Sc");
      expect(result).toHaveProperty("SA");
      expect(result).toHaveProperty("code");
      expect(result).toHaveProperty("message");
    });

    it("passes screening for flexible piping with adequate L", () => {
      // Long developed length, small displacement → should pass
      const input: ScreeningInput = {
        ...baseInput,
        L: 50, // Very long developed length
        U: 10, // Short anchor distance
        T1: 100, // Low temperature → small expansion
      };
      const result = performScreening(input);
      expect(result.analysisRequired).toBe(false);
      expect(result.utilization).toBeLessThan(1.0);
      expect(result.message).toContain("PASSES");
    });

    it("fails screening for stiff piping", () => {
      // Short L, close to U, high temperature → should fail
      const input: ScreeningInput = {
        ...baseInput,
        Do: 323.8, // 12" pipe
        L: 15,
        U: 14, // Almost straight → L-U = 1m
        T1: 400, // High temperature
      };
      const result = performScreening(input);
      expect(result.analysisRequired).toBe(true);
      expect(result.utilization).toBeGreaterThan(1.0);
      expect(result.message).toContain("FAILS");
    });

    it("handles L = U (straight run between anchors)", () => {
      const input: ScreeningInput = {
        ...baseInput,
        L: 20,
        U: 20, // No flexibility
      };
      const result = performScreening(input);
      expect(result.analysisRequired).toBe(true);
      expect(result.ratio).toBe(Infinity);
      expect(result.message).toContain("straight");
    });

    it("uses provided y value instead of estimating", () => {
      const input: ScreeningInput = {
        ...baseInput,
        y: 50, // Explicit displacement in mm
      };
      const result = performScreening(input);
      expect(result.y).toBe(50);
    });

    it("adds yAdditional to thermal displacement", () => {
      const withoutExtra = performScreening(baseInput);
      const withExtra = performScreening({ ...baseInput, yAdditional: 10 });
      expect(withExtra.y).toBeCloseTo(withoutExtra.y + 10, 1);
    });

    it("returns correct K1 constant for SI", () => {
      const result = performScreening(baseInput);
      expect(result.K1).toBe(K1_SI);
      expect(result.K1).toBe(208);
    });

    it("calculates utilization correctly", () => {
      const result = performScreening(baseInput);
      expect(result.utilization).toBeCloseTo(result.ratio / result.K1, 5);
    });

    it("returns correct material properties", () => {
      const result = performScreening(baseInput);

      // Ea at 20°C for CS should be ~203400 MPa
      expect(result.Ea).toBeCloseTo(203400, 0);

      // Ec at 300°C for CS should be ~187500 MPa
      expect(result.Ec).toBeCloseTo(187500, 0);

      // Sc at 20°C for CS = 137.9 MPa
      expect(result.Sc).toBeCloseTo(137.9, 0);

      // Sh at 300°C for CS = 137.9 MPa (still at full allowable)
      expect(result.Sh).toBeCloseTo(137.9, 0);
    });

    it("calculates SA correctly", () => {
      const result = performScreening(baseInput);
      const expectedSA = allowableStressRange(result.Sc, result.Sh);
      expect(result.SA).toBeCloseTo(expectedSA, 1);
    });

    it("defaults T2 to 20°C", () => {
      const input: ScreeningInput = {
        code: "B31.3",
        material: "Carbon Steel (A106-B)",
        Do: 168.3,
        tn: 7.11,
        T1: 300,
        L: 30,
        U: 20,
        // T2 omitted
      };
      const result = performScreening(input);
      expect(result.Ea).toBeCloseTo(203400, 0); // E at 20°C
    });

    // Validation tests
    it("throws for L <= 0", () => {
      expect(() => performScreening({ ...baseInput, L: 0 })).toThrow(
        "Developed length L must be positive",
      );
    });

    it("throws for U <= 0", () => {
      expect(() => performScreening({ ...baseInput, U: 0 })).toThrow(
        "Anchor distance U must be positive",
      );
    });

    it("throws for L < U", () => {
      expect(() => performScreening({ ...baseInput, L: 10, U: 20 })).toThrow(
        "Developed length L must be ≥ anchor distance U",
      );
    });

    it("throws for Do <= 0", () => {
      expect(() => performScreening({ ...baseInput, Do: 0 })).toThrow(
        "Diameter Do must be positive",
      );
    });

    it("throws for tn <= 0", () => {
      expect(() => performScreening({ ...baseInput, tn: 0 })).toThrow(
        "Wall thickness tn must be positive",
      );
    });

    it("throws for tn >= Do/2", () => {
      expect(() => performScreening({ ...baseInput, tn: 100 })).toThrow(
        "Wall thickness tn must be less than radius",
      );
    });

    it("throws for unknown material", () => {
      expect(() =>
        performScreening({ ...baseInput, material: "Adamantium" }),
      ).toThrow('Material "Adamantium" not found');
    });
  });

  describe("passesScreening", () => {
    it("returns true when screening passes", () => {
      const input: ScreeningInput = {
        ...baseInput,
        L: 50,
        U: 10,
        T1: 100,
      };
      expect(passesScreening(input)).toBe(true);
    });

    it("returns false when screening fails", () => {
      const input: ScreeningInput = {
        ...baseInput,
        Do: 323.8,
        L: 15,
        U: 14,
        T1: 400,
      };
      expect(passesScreening(input)).toBe(false);
    });
  });

  describe("minimumDevelopedLength", () => {
    it("calculates L_min = U + sqrt(D·y / K1)", () => {
      const Do = 168.3;
      const y = 73; // mm
      const U = 20; // m

      const Lmin = minimumDevelopedLength(Do, y, U);

      // L_min = 20 + sqrt(168.3 * 73 / 208) = 20 + sqrt(59.1) ≈ 20 + 7.69 ≈ 27.69
      expect(Lmin).toBeCloseTo(27.69, 0);
    });

    it("returns U when y <= 0", () => {
      expect(minimumDevelopedLength(168.3, 0, 20)).toBe(20);
      expect(minimumDevelopedLength(168.3, -5, 20)).toBe(20);
    });

    it("returns U when Do <= 0", () => {
      expect(minimumDevelopedLength(0, 73, 20)).toBe(20);
    });

    it("minimum L is always >= U", () => {
      const Lmin = minimumDevelopedLength(168.3, 73, 20);
      expect(Lmin).toBeGreaterThanOrEqual(20);
    });

    it("larger diameter requires longer L", () => {
      const Lmin6 = minimumDevelopedLength(168.3, 73, 20); // 6"
      const Lmin12 = minimumDevelopedLength(323.8, 73, 20); // 12"
      expect(Lmin12).toBeGreaterThan(Lmin6);
    });

    it("larger displacement requires longer L", () => {
      const LminLow = minimumDevelopedLength(168.3, 30, 20);
      const LminHigh = minimumDevelopedLength(168.3, 100, 20);
      expect(LminHigh).toBeGreaterThan(LminLow);
    });

    it("accepts custom K1", () => {
      const LminSI = minimumDevelopedLength(168.3, 73, 20, K1_SI);
      // Imperial K1 is much smaller → would require much longer length
      // but units would be different, so this just tests the parameter works
      const LminCustom = minimumDevelopedLength(168.3, 73, 20, 100);
      expect(LminCustom).toBeGreaterThan(LminSI);
    });
  });

  describe("screening: real-world scenarios", () => {
    it("4\" CS pipe at 200°C, L=20m, U=15m — should pass", () => {
      const result = performScreening({
        code: "B31.3",
        material: "Carbon Steel (A106-B)",
        Do: 114.3, // 4" NPS
        tn: 6.02, // Sch 40
        T1: 200,
        L: 20,
        U: 15,
      });
      // Moderate temperature, decent flexibility → likely passes
      expect(result.ratio).toBeLessThan(K1_SI);
      expect(result.analysisRequired).toBe(false);
    });

    it("16\" SS pipe at 500°C, L=25m, U=22m — should fail", () => {
      const result = performScreening({
        code: "B31.3",
        material: "304 Stainless Steel",
        Do: 406.4, // 16" NPS
        tn: 12.7, // Sch 40
        T1: 500,
        L: 25,
        U: 22,
      });
      // Large diameter, high temperature, little flexibility → fails
      expect(result.analysisRequired).toBe(true);
    });

    it("2\" CS pipe at 150°C, L=12m, U=8m — should pass", () => {
      const result = performScreening({
        code: "B31.3",
        material: "Carbon Steel (A106-B)",
        Do: 60.3, // 2" NPS
        tn: 3.91, // Sch 40
        T1: 150,
        L: 12,
        U: 8,
      });
      // Small pipe, low temperature, good flexibility → passes
      expect(result.analysisRequired).toBe(false);
    });
  });
});
