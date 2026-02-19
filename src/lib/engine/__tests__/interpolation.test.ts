import { describe, it, expect } from "vitest";
import {
  interpolate,
  bilinearInterpolate,
  findBracketIndex,
  createLookup,
  type DataPoint,
} from "../interpolation";

describe("interpolation", () => {
  const table: DataPoint[] = [
    { temperature: 0, value: 100 },
    { temperature: 100, value: 200 },
    { temperature: 200, value: 280 },
    { temperature: 300, value: 340 },
  ];

  describe("interpolate", () => {
    it("throws on empty table", () => {
      expect(() => interpolate([], 50)).toThrow("Interpolation table is empty");
    });

    it("returns single value for single-point table", () => {
      expect(interpolate([{ temperature: 50, value: 42 }], 0)).toBe(42);
      expect(interpolate([{ temperature: 50, value: 42 }], 100)).toBe(42);
    });

    it("returns first value when temperature is below range", () => {
      expect(interpolate(table, -50)).toBe(100);
    });

    it("returns last value when temperature is above range", () => {
      expect(interpolate(table, 500)).toBe(340);
    });

    it("returns exact value at breakpoint", () => {
      expect(interpolate(table, 0)).toBe(100);
      expect(interpolate(table, 100)).toBe(200);
      expect(interpolate(table, 200)).toBe(280);
      expect(interpolate(table, 300)).toBe(340);
    });

    it("interpolates linearly between points", () => {
      // Midpoint of first interval: (0→100, 100→200)
      expect(interpolate(table, 50)).toBeCloseTo(150, 5);
    });

    it("interpolates at quarter points", () => {
      // 25% through first interval
      expect(interpolate(table, 25)).toBeCloseTo(125, 5);
      // 75% through first interval
      expect(interpolate(table, 75)).toBeCloseTo(175, 5);
    });

    it("interpolates in second interval correctly", () => {
      // 100→200: values 200→280, midpoint at 150
      expect(interpolate(table, 150)).toBeCloseTo(240, 5);
    });

    it("interpolates in third interval correctly", () => {
      // 200→300: values 280→340, midpoint at 250
      expect(interpolate(table, 250)).toBeCloseTo(310, 5);
    });
  });

  describe("findBracketIndex", () => {
    const arr = [10, 20, 30, 40, 50];

    it("returns 0 for value below range", () => {
      expect(findBracketIndex(arr, 5)).toBe(0);
    });

    it("returns last valid index for value above range", () => {
      expect(findBracketIndex(arr, 60)).toBe(3); // arr.length - 2
    });

    it("returns correct bracket for value in range", () => {
      expect(findBracketIndex(arr, 15)).toBe(0); // between 10 and 20
      expect(findBracketIndex(arr, 25)).toBe(1); // between 20 and 30
      expect(findBracketIndex(arr, 35)).toBe(2); // between 30 and 40
      expect(findBracketIndex(arr, 45)).toBe(3); // between 40 and 50
    });

    it("handles exact breakpoints", () => {
      expect(findBracketIndex(arr, 10)).toBe(0);
      // 20 matches bracket [10,20] at index 0 (>= lower bound)
      expect(findBracketIndex(arr, 20)).toBe(0);
      // 50 is at the end, clamped to arr.length - 2 = 3
      expect(findBracketIndex(arr, 50)).toBe(3);
    });

    it("handles single-element array", () => {
      expect(findBracketIndex([10], 5)).toBe(0);
      expect(findBracketIndex([10], 15)).toBe(0);
    });
  });

  describe("bilinearInterpolate", () => {
    const xValues = [0, 10];
    const yValues = [0, 10];
    // z = x + y (linear in both)
    const zTable = [
      [0, 10], // y=0: z = x
      [10, 20], // y=10: z = x + 10
    ];

    it("returns exact corner values", () => {
      expect(bilinearInterpolate(xValues, yValues, zTable, 0, 0)).toBe(0);
      expect(bilinearInterpolate(xValues, yValues, zTable, 10, 0)).toBe(10);
      expect(bilinearInterpolate(xValues, yValues, zTable, 0, 10)).toBe(10);
      expect(bilinearInterpolate(xValues, yValues, zTable, 10, 10)).toBe(20);
    });

    it("interpolates at center", () => {
      expect(bilinearInterpolate(xValues, yValues, zTable, 5, 5)).toBeCloseTo(
        10,
        5,
      );
    });

    it("interpolates along edges", () => {
      // Along x-axis (y=0)
      expect(bilinearInterpolate(xValues, yValues, zTable, 5, 0)).toBeCloseTo(
        5,
        5,
      );
      // Along y-axis (x=0)
      expect(bilinearInterpolate(xValues, yValues, zTable, 0, 5)).toBeCloseTo(
        5,
        5,
      );
    });

    it("extrapolates linearly outside the range using bracket clamping", () => {
      // findBracketIndex clamps to index 0, but the bilinear formula
      // still uses fractional t values (which become negative for out-of-range),
      // resulting in linear extrapolation: at (-5,-5) with corners 0,10,10,20
      // tx = (-5 - 0)/(10 - 0) = -0.5, ty = -0.5
      // z = 0*(1.5)*(1.5) + 10*(-0.5)*(1.5) + 10*(1.5)*(-0.5) + 20*(-0.5)*(-0.5)
      //   = 0 - 7.5 - 7.5 + 5 = -10
      expect(bilinearInterpolate(xValues, yValues, zTable, -5, -5)).toBe(-10);
    });

    it("handles larger grid", () => {
      const xs = [0, 1, 2];
      const ys = [0, 1, 2];
      const z = [
        [0, 1, 2],
        [1, 2, 3],
        [2, 3, 4],
      ];
      expect(bilinearInterpolate(xs, ys, z, 0.5, 0.5)).toBeCloseTo(1, 5);
      expect(bilinearInterpolate(xs, ys, z, 1.5, 1.5)).toBeCloseTo(3, 5);
    });
  });

  describe("createLookup", () => {
    it("creates a reusable lookup function", () => {
      const unsorted: DataPoint[] = [
        { temperature: 200, value: 280 },
        { temperature: 0, value: 100 },
        { temperature: 100, value: 200 },
      ];

      const lookup = createLookup(unsorted);

      expect(lookup(0)).toBe(100);
      expect(lookup(50)).toBeCloseTo(150, 5);
      expect(lookup(100)).toBe(200);
      expect(lookup(150)).toBeCloseTo(240, 5);
      expect(lookup(200)).toBe(280);
    });

    it("does not mutate the original array", () => {
      const original: DataPoint[] = [
        { temperature: 200, value: 2 },
        { temperature: 100, value: 1 },
      ];
      const copy = [...original];
      createLookup(original);
      expect(original).toEqual(copy);
    });
  });
});
