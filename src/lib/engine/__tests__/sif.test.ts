import { describe, it, expect } from "vitest";
import {
  bendSif,
  closelySpacedMiterSif,
  widelySpacedMiterSif,
  weldingTeeSif,
  unreinforcedTeeSif,
  reinforcedTeeSif,
  calculateSif,
  flexCharacteristic,
  type SifParams,
} from "../sif";

describe("sif", () => {
  // Common test pipe: 6" Sch 40 (Do = 168.3 mm, tn = 7.11 mm)
  const Do = 168.3;
  const tn = 7.11;

  describe("bendSif", () => {
    it("calculates SIF for a long-radius elbow (R = 1.5D)", () => {
      const R = 1.5 * Do; // 252.45 mm
      const result = bendSif(Do, tn, R);

      // h = tn * R / r²  = 7.11 * 252.45 / (84.15)² = 1794.9 / 7081.2 ≈ 0.2535
      expect(result.h).toBeCloseTo(0.2535, 2);

      // ii = 0.9 / h^(2/3) = 0.9 / 0.2535^0.667 ≈ 0.9 / 0.400 ≈ 2.25
      expect(result.ii).toBeGreaterThan(1.0);
      expect(result.ii).toBeCloseTo(2.25, 0);

      // io = 0.75 / h^(2/3)
      expect(result.io).toBeGreaterThan(1.0);
      expect(result.io).toBeLessThan(result.ii);

      // k = 1.65 / h
      expect(result.k).toBeGreaterThan(1.0);
    });

    it("calculates SIF for a short-radius elbow (R = 1.0D)", () => {
      const R = 1.0 * Do; // 168.3 mm
      const result = bendSif(Do, tn, R);

      // Shorter radius → lower h → higher SIF
      const longRadiusResult = bendSif(Do, tn, 1.5 * Do);
      expect(result.ii).toBeGreaterThan(longRadiusResult.ii);
    });

    it("calculates SIF for a 5D bend (very flexible)", () => {
      const R = 5.0 * Do; // 841.5 mm
      const result = bendSif(Do, tn, R);

      // Large radius → high h → lower SIF
      expect(result.h).toBeGreaterThan(0.5);
      expect(result.ii).toBeGreaterThan(1.0);
      expect(result.k).toBeGreaterThan(1.0);
    });

    it("enforces minimum SIF of 1.0", () => {
      // Very thick pipe, large radius → h is very large
      const result = bendSif(50, 20, 5000);
      expect(result.ii).toBeGreaterThanOrEqual(1.0);
      expect(result.io).toBeGreaterThanOrEqual(1.0);
      expect(result.k).toBeGreaterThanOrEqual(1.0);
    });

    it("SIF increases as wall thickness decreases", () => {
      const R = 1.5 * Do;
      const thick = bendSif(Do, 10, R);
      const thin = bendSif(Do, 5, R);
      expect(thin.ii).toBeGreaterThan(thick.ii);
    });
  });

  describe("closelySpacedMiterSif", () => {
    it("calculates SIF for closely spaced miter", () => {
      const s = 50; // miter spacing in mm
      const result = closelySpacedMiterSif(Do, tn, s);

      expect(result.h).toBeGreaterThan(0);
      expect(result.ii).toBeGreaterThan(1.0);
      expect(result.io).toBeGreaterThan(1.0);
    });

    it("smaller spacing gives higher SIF", () => {
      const close = closelySpacedMiterSif(Do, tn, 30);
      const far = closelySpacedMiterSif(Do, tn, 80);
      expect(close.ii).toBeGreaterThan(far.ii);
    });
  });

  describe("widelySpacedMiterSif", () => {
    it("calculates SIF for 22.5° miter", () => {
      const result = widelySpacedMiterSif(Do, tn, 22.5);

      expect(result.h).toBeGreaterThan(0);
      expect(result.ii).toBeGreaterThan(1.0);
    });

    it("larger angle gives lower h and higher SIF", () => {
      const small = widelySpacedMiterSif(Do, tn, 15);
      const large = widelySpacedMiterSif(Do, tn, 30);

      // Larger angle → larger tan(θ) → smaller h → higher SIF
      expect(large.ii).toBeGreaterThan(small.ii);
    });
  });

  describe("weldingTeeSif", () => {
    it("calculates SIF for a welding tee", () => {
      const result = weldingTeeSif(Do, tn);

      // h = 4.4 * tn / r = 4.4 * 7.11 / 84.15 ≈ 0.3716
      expect(result.h).toBeCloseTo(0.3716, 2);
      expect(result.ii).toBeGreaterThan(1.0);
      expect(result.io).toBeGreaterThan(1.0);
      expect(result.k).toBe(1.0); // tees have k=1
    });
  });

  describe("unreinforcedTeeSif", () => {
    it("calculates higher SIF than welding tee", () => {
      const unreinforced = unreinforcedTeeSif(Do, tn);
      const welding = weldingTeeSif(Do, tn);

      // Unreinforced tees have higher SIF (less reinforcement)
      expect(unreinforced.io).toBeGreaterThanOrEqual(welding.io);
    });

    it("all values >= 1.0", () => {
      const result = unreinforcedTeeSif(Do, tn);
      expect(result.ii).toBeGreaterThanOrEqual(1.0);
      expect(result.io).toBeGreaterThanOrEqual(1.0);
    });
  });

  describe("reinforcedTeeSif", () => {
    it("reinforcement pad reduces SIF compared to unreinforced", () => {
      const unreinforced = unreinforcedTeeSif(Do, tn);
      const reinforced = reinforcedTeeSif(Do, tn, tn); // tr = tn

      expect(reinforced.io).toBeLessThanOrEqual(unreinforced.io);
    });

    it("thicker pad gives lower SIF", () => {
      const thinPad = reinforcedTeeSif(Do, tn, 3);
      const thickPad = reinforcedTeeSif(Do, tn, 10);

      expect(thickPad.ii).toBeLessThanOrEqual(thinPad.ii);
    });
  });

  describe("calculateSif (dispatcher)", () => {
    const baseParams: SifParams = { Do, tn };

    it("returns fixed SIF for butt weld", () => {
      const result = calculateSif("butt_weld", baseParams);
      expect(result.ii).toBe(1.0);
      expect(result.io).toBe(1.0);
    });

    it("returns fixed SIF for socket weld", () => {
      const result = calculateSif("socket_weld", baseParams);
      expect(result.ii).toBe(2.1);
      expect(result.io).toBe(2.1);
    });

    it("returns fixed SIF for threaded joint", () => {
      const result = calculateSif("threaded_joint", baseParams);
      expect(result.ii).toBe(2.3);
      expect(result.io).toBe(2.3);
    });

    it("returns fixed SIF for weld neck flange", () => {
      const result = calculateSif("weld_neck_flange", baseParams);
      expect(result.ii).toBe(1.0);
    });

    it("returns fixed SIF for slip-on flange", () => {
      const result = calculateSif("slip_on_flange", baseParams);
      expect(result.ii).toBe(1.2);
    });

    it("returns fixed SIF for lap joint flange", () => {
      const result = calculateSif("lap_joint_flange", baseParams);
      expect(result.ii).toBe(1.6);
    });

    it("dispatches to bend calculation", () => {
      const result = calculateSif("bend", { ...baseParams, R: 1.5 * Do });
      expect(result.ii).toBeGreaterThan(1.0);
    });

    it("throws if bend R is missing", () => {
      expect(() => calculateSif("bend", baseParams)).toThrow("Bend radius R required");
    });

    it("dispatches to welding tee", () => {
      const result = calculateSif("welding_tee", baseParams);
      expect(result.ii).toBeGreaterThan(1.0);
    });

    it("dispatches to closely spaced miter", () => {
      const result = calculateSif("closely_spaced_miter", { ...baseParams, s: 50 });
      expect(result.ii).toBeGreaterThan(1.0);
    });

    it("throws if miter spacing s is missing", () => {
      expect(() => calculateSif("closely_spaced_miter", baseParams)).toThrow(
        "Miter spacing s required",
      );
    });

    it("dispatches to widely spaced miter", () => {
      const result = calculateSif("widely_spaced_miter", {
        ...baseParams,
        theta: 22.5,
      });
      expect(result.ii).toBeGreaterThan(1.0);
    });

    it("dispatches to reducer", () => {
      const result = calculateSif("reducer", { ...baseParams, alpha: 30 });
      expect(result.ii).toBeGreaterThanOrEqual(1.0);
    });

    it("throws if reducer alpha is missing", () => {
      expect(() => calculateSif("reducer", baseParams)).toThrow(
        "Cone angle alpha required",
      );
    });
  });

  describe("flexCharacteristic", () => {
    it("calculates h for a bend", () => {
      const h = flexCharacteristic({ Do, tn, R: 1.5 * Do }, "bend");
      expect(h).toBeCloseTo(0.2535, 2);
    });

    it("throws if R missing for bend", () => {
      expect(() => flexCharacteristic({ Do, tn }, "bend")).toThrow(
        "Bend radius R is required",
      );
    });

    it("returns 1.0 for butt weld", () => {
      expect(flexCharacteristic({ Do, tn }, "butt_weld")).toBe(1.0);
    });
  });
});
