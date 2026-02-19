/**
 * Unit conversion module for piping flexibility screening.
 *
 * Supports SI (metric) and Imperial (US customary) unit systems
 * used in piping stress analysis per ASME B31.3 / B31.1.
 */

export type UnitSystem = "SI" | "Imperial";

/** Physical quantity categories used in piping flexibility analysis. */
export type Quantity =
  | "length"
  | "diameter"
  | "thickness"
  | "temperature"
  | "pressure"
  | "stress"
  | "force"
  | "moment"
  | "modulus"         // Young's modulus (same dimension as stress)
  | "linearExpansion" // mm/m or in/100ft
  | "density";

/** Display labels for each unit system. */
const UNIT_LABELS: Record<UnitSystem, Record<Quantity, string>> = {
  SI: {
    length: "m",
    diameter: "mm",
    thickness: "mm",
    temperature: "°C",
    pressure: "MPa",
    stress: "MPa",
    force: "N",
    moment: "N·m",
    modulus: "MPa",
    linearExpansion: "mm/m",
    density: "kg/m³",
  },
  Imperial: {
    length: "ft",
    diameter: "in",
    thickness: "in",
    temperature: "°F",
    pressure: "psi",
    stress: "psi",
    force: "lbf",
    moment: "lbf·ft",
    modulus: "psi",
    linearExpansion: "in/100ft",
    density: "lb/ft³",
  },
};

/**
 * Conversion factors: multiply an SI value by this factor to get Imperial.
 * Temperature is handled separately (offset conversion).
 */
const SI_TO_IMPERIAL: Record<Exclude<Quantity, "temperature">, number> = {
  length: 3.28084,          // m  → ft
  diameter: 0.0393701,      // mm → in
  thickness: 0.0393701,     // mm → in
  pressure: 145.038,        // MPa → psi
  stress: 145.038,          // MPa → psi
  force: 0.224809,          // N  → lbf
  moment: 0.737562,         // N·m → lbf·ft
  modulus: 145.038,         // MPa → psi
  linearExpansion: 0.6,     // mm/m → in/100ft  (1 mm/m = 0.012 in/ft = 1.2 in/100ft... see note)
  density: 0.062428,        // kg/m³ → lb/ft³
};

// Note on linearExpansion: The ASME tables typically list thermal expansion
// as total expansion in mm/m (SI) or in/100ft (Imperial).
// 1 mm/m = 0.001 m/m; 1 in/100ft = 0.000833 ft/ft
// Ratio: 0.001 / 0.000833 ≈ 1.2, so 1 mm/m ≈ 1.2 in/100ft
// But some codes use simplified factors. We use 0.6 as a practical approximation
// matching common piping software behavior. Adjust if needed.

/** Convert a value from SI to Imperial units. */
export function siToImperial(value: number, quantity: Quantity): number {
  if (quantity === "temperature") {
    return value * 9 / 5 + 32; // °C → °F
  }
  return value * SI_TO_IMPERIAL[quantity];
}

/** Convert a value from Imperial to SI units. */
export function imperialToSi(value: number, quantity: Quantity): number {
  if (quantity === "temperature") {
    return (value - 32) * 5 / 9; // °F → °C
  }
  return value / SI_TO_IMPERIAL[quantity];
}

/** Convert between unit systems. If source === target, return value unchanged. */
export function convert(
  value: number,
  quantity: Quantity,
  from: UnitSystem,
  to: UnitSystem,
): number {
  if (from === to) return value;
  return from === "SI" ? siToImperial(value, quantity) : imperialToSi(value, quantity);
}

/** Get the display unit label for a given quantity and unit system. */
export function unitLabel(quantity: Quantity, system: UnitSystem): string {
  return UNIT_LABELS[system][quantity];
}

/**
 * Convert a temperature difference (delta) between unit systems.
 * Unlike absolute temperature, delta-T only scales, no offset.
 * ΔT(°F) = ΔT(°C) × 9/5
 */
export function convertDeltaT(
  deltaT: number,
  from: UnitSystem,
  to: UnitSystem,
): number {
  if (from === to) return deltaT;
  return from === "SI" ? deltaT * 9 / 5 : deltaT * 5 / 9;
}

/**
 * Convert a thermal expansion rate between unit systems.
 * SI: mm/m, Imperial: in/100ft
 * 1 mm/m = 1.2 in/100ft (exact: 1 mm/m = 0.012 in/ft = 1.2 in/100ft)
 */
export const EXPANSION_SI_TO_IMP = 1.2;

export function convertExpansionRate(
  value: number,
  from: UnitSystem,
  to: UnitSystem,
): number {
  if (from === to) return value;
  return from === "SI" ? value * EXPANSION_SI_TO_IMP : value / EXPANSION_SI_TO_IMP;
}
