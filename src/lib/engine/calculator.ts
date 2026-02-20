/**
 * Piping Flexibility Screening Calculator per ASME B31.3 §319.4.1.
 *
 * This module implements the simplified screening criterion that determines
 * whether a formal flexibility analysis is required for a piping system.
 *
 * The screening criterion (B31.3 §319.4.1(c)) states that formal analysis
 * is not required if:
 *
 *   D·y / (L - U)² ≤ K₁
 *
 * Where:
 *   D = nominal pipe outside diameter (mm or in)
 *   y = resultant total displacement to be absorbed (mm or in)
 *   L = developed length of piping between anchors (m or ft)
 *   U = straight-line distance between anchors (m or ft)
 *   K₁ = 208 (SI, mm·mm/m²) or 0.03 (Imperial, in·in/ft²)
 *
 * Additionally, §319.4.1(a) and (b) provide conditions for exemption:
 *   (a) A system that duplicates an existing successful system.
 *   (b) A system that can be judged adequate by comparison with analyzed systems.
 *
 * References:
 *   - ASME B31.3-2022, §319.4.1
 *   - ASME B31.1, §119.7
 */

import { interpolate, type DataPoint } from "./interpolation";

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * K₁ screening constant.
 * SI:       208 mm²/m²  (D in mm, y in mm, L in m, U in m)
 * Imperial: 0.03 in²/ft² (D in in, y in in, L in ft, U in ft)
 */
export const K1_SI = 208;
export const K1_IMPERIAL = 0.03;

// ─── Material Data Tables ────────────────────────────────────────────────────

/**
 * Young's modulus (E) vs temperature for common piping materials.
 * Values in MPa. Source: ASME B31.3 Table C-6.
 */
export const YOUNGS_MODULUS_TABLES: Record<string, DataPoint[]> = {
  "Carbon Steel (A106-B)": [
    { temperature: 20, value: 203400 },
    { temperature: 100, value: 199900 },
    { temperature: 150, value: 197200 },
    { temperature: 200, value: 194400 },
    { temperature: 250, value: 191000 },
    { temperature: 300, value: 187500 },
    { temperature: 350, value: 183400 },
    { temperature: 400, value: 179300 },
    { temperature: 425, value: 176500 },
    { temperature: 450, value: 173700 },
    { temperature: 500, value: 168200 },
  ],
  "304 Stainless Steel": [
    { temperature: 20, value: 195100 },
    { temperature: 100, value: 190300 },
    { temperature: 150, value: 187500 },
    { temperature: 200, value: 184100 },
    { temperature: 250, value: 180600 },
    { temperature: 300, value: 177200 },
    { temperature: 350, value: 173100 },
    { temperature: 400, value: 169600 },
    { temperature: 450, value: 165500 },
    { temperature: 500, value: 161300 },
    { temperature: 550, value: 157200 },
    { temperature: 600, value: 153100 },
  ],
  "316 Stainless Steel": [
    { temperature: 20, value: 195100 },
    { temperature: 100, value: 190300 },
    { temperature: 150, value: 187500 },
    { temperature: 200, value: 184100 },
    { temperature: 250, value: 180600 },
    { temperature: 300, value: 177200 },
    { temperature: 350, value: 173700 },
    { temperature: 400, value: 169600 },
    { temperature: 450, value: 165500 },
    { temperature: 500, value: 161300 },
    { temperature: 550, value: 157200 },
    { temperature: 600, value: 153100 },
  ],
  "Chrome-Moly (A335-P11)": [
    { temperature: 20, value: 207500 },
    { temperature: 100, value: 203400 },
    { temperature: 150, value: 201300 },
    { temperature: 200, value: 198600 },
    { temperature: 250, value: 195800 },
    { temperature: 300, value: 192400 },
    { temperature: 350, value: 188900 },
    { temperature: 400, value: 185400 },
    { temperature: 450, value: 181300 },
    { temperature: 500, value: 177200 },
    { temperature: 550, value: 173100 },
  ],
};

/**
 * Mean thermal expansion coefficient (α) vs temperature.
 * Values in mm/m (from ambient 20°C to indicated temperature).
 * Source: ASME B31.3 Table C-3.
 */
export const THERMAL_EXPANSION_TABLES: Record<string, DataPoint[]> = {
  "Carbon Steel (A106-B)": [
    { temperature: 20, value: 0.0 },
    { temperature: 50, value: 0.36 },
    { temperature: 100, value: 0.99 },
    { temperature: 150, value: 1.63 },
    { temperature: 200, value: 2.29 },
    { temperature: 250, value: 2.96 },
    { temperature: 300, value: 3.65 },
    { temperature: 350, value: 4.35 },
    { temperature: 400, value: 5.07 },
    { temperature: 450, value: 5.80 },
    { temperature: 500, value: 6.55 },
  ],
  "304 Stainless Steel": [
    { temperature: 20, value: 0.0 },
    { temperature: 50, value: 0.49 },
    { temperature: 100, value: 1.33 },
    { temperature: 150, value: 2.19 },
    { temperature: 200, value: 3.07 },
    { temperature: 250, value: 3.96 },
    { temperature: 300, value: 4.87 },
    { temperature: 350, value: 5.80 },
    { temperature: 400, value: 6.74 },
    { temperature: 450, value: 7.70 },
    { temperature: 500, value: 8.68 },
    { temperature: 550, value: 9.67 },
    { temperature: 600, value: 10.69 },
  ],
  "316 Stainless Steel": [
    { temperature: 20, value: 0.0 },
    { temperature: 50, value: 0.49 },
    { temperature: 100, value: 1.33 },
    { temperature: 150, value: 2.19 },
    { temperature: 200, value: 3.07 },
    { temperature: 250, value: 3.96 },
    { temperature: 300, value: 4.87 },
    { temperature: 350, value: 5.80 },
    { temperature: 400, value: 6.74 },
    { temperature: 450, value: 7.70 },
    { temperature: 500, value: 8.68 },
    { temperature: 550, value: 9.67 },
    { temperature: 600, value: 10.69 },
  ],
  "Chrome-Moly (A335-P11)": [
    { temperature: 20, value: 0.0 },
    { temperature: 50, value: 0.35 },
    { temperature: 100, value: 0.96 },
    { temperature: 150, value: 1.59 },
    { temperature: 200, value: 2.23 },
    { temperature: 250, value: 2.89 },
    { temperature: 300, value: 3.57 },
    { temperature: 350, value: 4.26 },
    { temperature: 400, value: 4.96 },
    { temperature: 450, value: 5.69 },
    { temperature: 500, value: 6.42 },
    { temperature: 550, value: 7.18 },
  ],
};

/**
 * Allowable stress (Sh) vs temperature for common materials.
 * Values in MPa.
 *
 * B31.3 (Process Piping): Source ASME B31.3 Table A-1.
 *   Uses 1/3 tensile strength basis — higher allowable stresses.
 *
 * B31.1 (Power Piping): Source ASME B31.1 Table A-1.
 *   Uses 1/3.5 tensile strength basis — more conservative allowable stresses.
 */
export const ALLOWABLE_STRESS_TABLES: Record<string, DataPoint[]> = {
  "Carbon Steel (A106-B)": [
    { temperature: 20, value: 137.9 },
    { temperature: 100, value: 137.9 },
    { temperature: 150, value: 137.9 },
    { temperature: 200, value: 137.9 },
    { temperature: 250, value: 137.9 },
    { temperature: 300, value: 137.9 },
    { temperature: 350, value: 133.8 },
    { temperature: 400, value: 118.6 },
    { temperature: 425, value: 108.2 },
    { temperature: 450, value: 95.1 },
    { temperature: 500, value: 68.3 },
  ],
  "304 Stainless Steel": [
    { temperature: 20, value: 137.9 },
    { temperature: 100, value: 131.0 },
    { temperature: 150, value: 125.5 },
    { temperature: 200, value: 120.7 },
    { temperature: 250, value: 116.5 },
    { temperature: 300, value: 113.1 },
    { temperature: 350, value: 110.3 },
    { temperature: 400, value: 108.2 },
    { temperature: 450, value: 106.2 },
    { temperature: 500, value: 104.1 },
    { temperature: 550, value: 102.0 },
    { temperature: 600, value: 100.0 },
  ],
  "316 Stainless Steel": [
    { temperature: 20, value: 137.9 },
    { temperature: 100, value: 131.0 },
    { temperature: 150, value: 125.5 },
    { temperature: 200, value: 120.7 },
    { temperature: 250, value: 116.5 },
    { temperature: 300, value: 113.1 },
    { temperature: 350, value: 110.3 },
    { temperature: 400, value: 108.2 },
    { temperature: 450, value: 106.2 },
    { temperature: 500, value: 104.8 },
    { temperature: 550, value: 103.4 },
    { temperature: 600, value: 102.0 },
  ],
  "Chrome-Moly (A335-P11)": [
    { temperature: 20, value: 120.7 },
    { temperature: 100, value: 120.7 },
    { temperature: 150, value: 120.7 },
    { temperature: 200, value: 120.7 },
    { temperature: 250, value: 120.7 },
    { temperature: 300, value: 120.7 },
    { temperature: 350, value: 120.7 },
    { temperature: 400, value: 120.7 },
    { temperature: 450, value: 118.6 },
    { temperature: 500, value: 113.1 },
    { temperature: 550, value: 98.6 },
  ],
};

/**
 * Allowable stress tables for ASME B31.1 (Power Piping).
 * Values in MPa. Source: ASME B31.1 Table A-1.
 *
 * B31.1 uses 1/3.5 × tensile strength (vs 1/3 for B31.3),
 * resulting in lower allowable stresses for the same materials.
 */
export const ALLOWABLE_STRESS_TABLES_B311: Record<string, DataPoint[]> = {
  "Carbon Steel (A106-B)": [
    { temperature: 20, value: 120.7 },
    { temperature: 100, value: 120.7 },
    { temperature: 150, value: 120.7 },
    { temperature: 200, value: 120.7 },
    { temperature: 250, value: 120.7 },
    { temperature: 300, value: 120.7 },
    { temperature: 350, value: 117.2 },
    { temperature: 400, value: 103.4 },
    { temperature: 425, value: 94.5 },
    { temperature: 450, value: 82.7 },
    { temperature: 500, value: 58.6 },
  ],
  "304 Stainless Steel": [
    { temperature: 20, value: 120.7 },
    { temperature: 100, value: 115.1 },
    { temperature: 150, value: 110.3 },
    { temperature: 200, value: 106.2 },
    { temperature: 250, value: 102.7 },
    { temperature: 300, value: 99.3 },
    { temperature: 350, value: 97.2 },
    { temperature: 400, value: 95.1 },
    { temperature: 450, value: 93.8 },
    { temperature: 500, value: 92.4 },
    { temperature: 550, value: 91.0 },
    { temperature: 600, value: 89.6 },
  ],
  "316 Stainless Steel": [
    { temperature: 20, value: 120.7 },
    { temperature: 100, value: 115.1 },
    { temperature: 150, value: 110.3 },
    { temperature: 200, value: 106.2 },
    { temperature: 250, value: 102.7 },
    { temperature: 300, value: 99.3 },
    { temperature: 350, value: 97.2 },
    { temperature: 400, value: 95.1 },
    { temperature: 450, value: 93.8 },
    { temperature: 500, value: 92.4 },
    { temperature: 550, value: 91.7 },
    { temperature: 600, value: 91.0 },
  ],
  "Chrome-Moly (A335-P11)": [
    { temperature: 20, value: 103.4 },
    { temperature: 100, value: 103.4 },
    { temperature: 150, value: 103.4 },
    { temperature: 200, value: 103.4 },
    { temperature: 250, value: 103.4 },
    { temperature: 300, value: 103.4 },
    { temperature: 350, value: 103.4 },
    { temperature: 400, value: 103.4 },
    { temperature: 450, value: 101.3 },
    { temperature: 500, value: 96.5 },
    { temperature: 550, value: 84.1 },
  ],
};

/**
 * Get the correct allowable stress table for a given piping code.
 * B31.3 uses higher allowable stresses (1/3 UTS basis).
 * B31.1 uses more conservative values (1/3.5 UTS basis).
 */
export function getAllowableStressTable(
  code: PipingCode,
): Record<string, DataPoint[]> {
  return code === "B31.1"
    ? ALLOWABLE_STRESS_TABLES_B311
    : ALLOWABLE_STRESS_TABLES;
}

/** List of available material names for a given code. */
export function getAvailableMaterials(code?: PipingCode): string[] {
  if (code) {
    const stressTable = getAllowableStressTable(code);
    // Return materials present in all three tables for this code
    return Object.keys(YOUNGS_MODULUS_TABLES).filter(
      (m) => m in stressTable && m in THERMAL_EXPANSION_TABLES,
    );
  }
  return Object.keys(YOUNGS_MODULUS_TABLES);
}

// ─── Input / Output Types ────────────────────────────────────────────────────

/** Code edition for the screening check. */
export type PipingCode = "B31.3" | "B31.1";

/** Input parameters for the flexibility screening calculation. */
export interface ScreeningInput {
  /** Piping code to use. */
  code: PipingCode;
  /** Material name (must match keys in data tables). */
  material: string;
  /** Nominal outside diameter in mm. */
  Do: number;
  /** Nominal wall thickness in mm. */
  tn: number;
  /** Design temperature in °C. */
  T1: number;
  /** Ambient/installation temperature in °C. Default: 20°C. */
  T2?: number;
  /** Developed length of piping between anchors in m. */
  L: number;
  /** Straight-line distance between anchors in m. */
  U: number;
  /**
   * Total resultant displacement to be absorbed in mm.
   * If not provided, it is estimated from thermal expansion.
   */
  y?: number;
  /**
   * Additional imposed displacements (equipment nozzle movements, etc.) in mm.
   * Added to thermal displacement.
   */
  yAdditional?: number;
}

/** Detailed results from the screening calculation. */
export interface ScreeningResult {
  /** Whether formal analysis is required. */
  analysisRequired: boolean;
  /** The computed screening ratio: D·y / (L-U)². */
  ratio: number;
  /** The K₁ threshold used. */
  K1: number;
  /** Utilization = ratio / K₁ (>1.0 means analysis required). */
  utilization: number;
  /** Thermal expansion used (mm/m from table). */
  thermalExpansion: number;
  /** Total displacement y (mm). */
  y: number;
  /** Effective length (L - U) in m. */
  effectiveLength: number;
  /** Young's modulus at design temperature (MPa). */
  Ec: number;
  /** Young's modulus at ambient temperature (MPa). */
  Ea: number;
  /** Allowable stress at design temperature (MPa). */
  Sh: number;
  /** Allowable stress at ambient temperature (MPa). */
  Sc: number;
  /** Allowable displacement stress range SA (MPa) per §302.3.5. */
  SA: number;
  /** Code used. */
  code: PipingCode;
  /** Status message. */
  message: string;
}

// ─── Core Calculations ───────────────────────────────────────────────────────

/**
 * Estimate total thermal displacement for anchor-to-anchor distance U.
 *
 * y = α·ΔT × U  (simplified for screening)
 *
 * Where:
 *   α·ΔT = total expansion in mm/m from ambient to design temperature (from table)
 *   U    = anchor-to-anchor distance in m
 *
 * The result is in mm.
 */
export function estimateThermalDisplacement(
  material: string,
  T1: number,
  T2: number,
  U: number,
): number {
  const table = THERMAL_EXPANSION_TABLES[material];
  if (!table) {
    throw new Error(`Unknown material: ${material}`);
  }

  // Get total expansion at T1 and T2 (mm/m from 20°C reference)
  const expansionAtT1 = interpolate(table, T1);
  const expansionAtT2 = interpolate(table, T2);

  // Net expansion rate in mm/m
  const netExpansion = expansionAtT1 - expansionAtT2;

  // Total displacement in mm = (mm/m) × m
  return Math.abs(netExpansion * U);
}

/**
 * Calculate the allowable displacement stress range SA per B31.3 §302.3.5(d).
 *
 *   SA = f · (1.25·Sc + 0.25·Sh)
 *
 * Where:
 *   f  = stress range reduction factor (1.0 for ≤ 7000 cycles)
 *   Sc = basic allowable stress at minimum (ambient) temperature
 *   Sh = basic allowable stress at maximum (design) temperature
 */
export function allowableStressRange(
  Sc: number,
  Sh: number,
  f: number = 1.0,
): number {
  return f * (1.25 * Sc + 0.25 * Sh);
}

/**
 * Main screening calculation per ASME B31.3 §319.4.1(c) / B31.1 §119.7.1(A).
 *
 * Criterion: D·y / (L - U)² ≤ K₁
 *
 * The formula is identical for both codes. The difference lies in the
 * allowable stress tables used (B31.1 is more conservative).
 *
 * If the criterion is satisfied, formal flexibility analysis is NOT required.
 */
export function performScreening(input: ScreeningInput): ScreeningResult {
  const {
    code,
    material,
    Do,
    tn,
    T1,
    T2 = 20,
    L,
    U,
    yAdditional = 0,
  } = input;

  // Validate inputs
  if (L <= 0) throw new Error("Developed length L must be positive");
  if (U <= 0) throw new Error("Anchor distance U must be positive");
  if (L < U) throw new Error("Developed length L must be ≥ anchor distance U");
  if (Do <= 0) throw new Error("Diameter Do must be positive");
  if (tn <= 0) throw new Error("Wall thickness tn must be positive");
  if (tn >= Do / 2) throw new Error("Wall thickness tn must be less than radius");

  // Material property lookups (allowable stress depends on piping code)
  const eTable = YOUNGS_MODULUS_TABLES[material];
  const stressTables = getAllowableStressTable(code);
  const shTable = stressTables[material];
  const expTable = THERMAL_EXPANSION_TABLES[material];

  if (!eTable || !shTable || !expTable) {
    throw new Error(`Material "${material}" not found in data tables`);
  }

  // Interpolate properties
  const Ea = interpolate(eTable, T2);
  const Ec = interpolate(eTable, T1);
  const Sc = interpolate(shTable, T2);
  const Sh = interpolate(shTable, T1);
  const thermalExpansion = interpolate(expTable, T1) - interpolate(expTable, T2);

  // Compute displacement
  const yThermal = input.y ?? estimateThermalDisplacement(material, T1, T2, U);
  const y = yThermal + yAdditional;

  // Effective length
  const effectiveLength = L - U;

  // Screening criterion
  const K1 = K1_SI; // We work in SI internally

  let ratio: number;
  let analysisRequired: boolean;
  let message: string;

  if (effectiveLength <= 0) {
    // Straight run with no flexibility — always requires analysis
    ratio = Infinity;
    analysisRequired = true;
    message =
      "L = U: the piping runs straight between anchors with no flexibility offset. Formal analysis is required.";
  } else {
    // D(mm) × y(mm) / (L-U)²(m²) → mm²/m²
    ratio = (Do * y) / (effectiveLength * effectiveLength);
    analysisRequired = ratio > K1;

    if (analysisRequired) {
      message = `Screening FAILS: D·y/(L-U)² = ${ratio.toFixed(1)} > ${K1} — formal flexibility analysis is required.`;
    } else {
      message = `Screening PASSES: D·y/(L-U)² = ${ratio.toFixed(1)} ≤ ${K1} — formal analysis is NOT required.`;
    }
  }

  const utilization = ratio === Infinity ? Infinity : ratio / K1;

  // Allowable stress range
  const SA = allowableStressRange(Sc, Sh);

  return {
    analysisRequired,
    ratio,
    K1,
    utilization,
    thermalExpansion,
    y,
    effectiveLength,
    Ec,
    Ea,
    Sh,
    Sc,
    SA,
    code,
    message,
  };
}

/**
 * Quick check: returns true if the system passes the screening
 * (i.e., formal analysis is NOT required).
 */
export function passesScreening(input: ScreeningInput): boolean {
  return !performScreening(input).analysisRequired;
}

/**
 * Calculate the minimum required developed length L for a given configuration
 * to pass the screening criterion.
 *
 *   D·y / (L-U)² ≤ K₁
 *   (L-U)² ≥ D·y / K₁
 *   L ≥ U + √(D·y / K₁)
 */
export function minimumDevelopedLength(
  Do: number,
  y: number,
  U: number,
  K1: number = K1_SI,
): number {
  if (y <= 0 || Do <= 0) return U;
  return U + Math.sqrt((Do * y) / K1);
}
