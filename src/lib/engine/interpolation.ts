/**
 * Interpolation utilities for piping material property lookups.
 *
 * ASME B31.3 / B31.1 tables provide material properties (allowable stress,
 * Young's modulus, thermal expansion) at discrete temperature points.
 * This module provides linear interpolation between those points.
 */

/** A single data point: temperature → value. */
export interface DataPoint {
  temperature: number;
  value: number;
}

/**
 * Linearly interpolate a value from a sorted table of (temperature, value) pairs.
 *
 * - If T is below the first point, returns the first value (no extrapolation down).
 * - If T is above the last point, returns the last value (no extrapolation up).
 * - Otherwise, linearly interpolates between the two bracketing points.
 *
 * @param table - Array of DataPoints sorted by ascending temperature.
 * @param temperature - The temperature to look up.
 * @returns The interpolated value.
 * @throws If the table is empty.
 */
export function interpolate(table: DataPoint[], temperature: number): number {
  if (table.length === 0) {
    throw new Error("Interpolation table is empty");
  }

  if (table.length === 1 || temperature <= table[0].temperature) {
    return table[0].value;
  }

  if (temperature >= table[table.length - 1].temperature) {
    return table[table.length - 1].value;
  }

  // Find the bracketing interval
  for (let i = 0; i < table.length - 1; i++) {
    const lo = table[i];
    const hi = table[i + 1];
    if (temperature >= lo.temperature && temperature <= hi.temperature) {
      const fraction =
        (temperature - lo.temperature) / (hi.temperature - lo.temperature);
      return lo.value + fraction * (hi.value - lo.value);
    }
  }

  // Should not reach here if the table is sorted, but return last value as fallback
  return table[table.length - 1].value;
}

/**
 * Perform bilinear interpolation on a 2D table.
 *
 * Used for properties that depend on two variables, e.g., SIF as a function
 * of both bend radius and pipe diameter ratio.
 *
 * @param xValues - Sorted array of x-axis breakpoints.
 * @param yValues - Sorted array of y-axis breakpoints.
 * @param zTable  - 2D array of z values: zTable[yi][xi].
 * @param x       - The x value to interpolate at.
 * @param y       - The y value to interpolate at.
 * @returns The interpolated z value.
 */
export function bilinearInterpolate(
  xValues: number[],
  yValues: number[],
  zTable: number[][],
  x: number,
  y: number,
): number {
  const xi = findBracketIndex(xValues, x);
  const yi = findBracketIndex(yValues, y);

  const x0 = xValues[xi];
  const x1 = xValues[xi + 1] ?? x0;
  const y0 = yValues[yi];
  const y1 = yValues[yi + 1] ?? y0;

  const z00 = zTable[yi]?.[xi] ?? 0;
  const z10 = zTable[yi]?.[xi + 1] ?? z00;
  const z01 = zTable[yi + 1]?.[xi] ?? z00;
  const z11 = zTable[yi + 1]?.[xi + 1] ?? z10;

  const tx = x1 !== x0 ? (x - x0) / (x1 - x0) : 0;
  const ty = y1 !== y0 ? (y - y0) / (y1 - y0) : 0;

  // Bilinear blend
  return (
    z00 * (1 - tx) * (1 - ty) +
    z10 * tx * (1 - ty) +
    z01 * (1 - tx) * ty +
    z11 * tx * ty
  );
}

/**
 * Find the lower bracket index for a value in a sorted array.
 * Clamps to [0, arr.length - 2] so there's always a valid upper neighbor.
 */
export function findBracketIndex(arr: number[], value: number): number {
  if (arr.length < 2) return 0;

  if (value <= arr[0]) return 0;
  if (value >= arr[arr.length - 1]) return arr.length - 2;

  for (let i = 0; i < arr.length - 1; i++) {
    if (value >= arr[i] && value <= arr[i + 1]) {
      return i;
    }
  }

  return arr.length - 2;
}

/**
 * Create a lookup function from a set of discrete data points.
 * Useful for building reusable property lookup closures.
 */
export function createLookup(table: DataPoint[]): (temperature: number) => number {
  const sorted = [...table].sort((a, b) => a.temperature - b.temperature);
  return (temperature: number) => interpolate(sorted, temperature);
}
