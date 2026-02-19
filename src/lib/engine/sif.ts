/**
 * Stress Intensification Factor (SIF) calculations per ASME B31.3 Appendix D.
 *
 * SIFs account for the stress-raising effect of piping components
 * (bends, tees, reducers, etc.) compared to girth butt welds.
 * The minimum SIF value is 1.0 (equivalent to a girth butt weld).
 *
 * Key references:
 * - ASME B31.3-2022, Appendix D, Table D300
 * - ASME B31.1, Appendix D
 */

/** Piping component types for SIF calculations. */
export type ComponentType =
  | "bend"
  | "closely_spaced_miter"
  | "widely_spaced_miter"
  | "welding_tee"
  | "reinforced_tee"
  | "unreinforced_tee"
  | "weld_neck_flange"
  | "slip_on_flange"
  | "lap_joint_flange"
  | "threaded_joint"
  | "socket_weld"
  | "butt_weld"
  | "reducer";

/** Parameters needed for SIF calculation depending on component type. */
export interface SifParams {
  /** Nominal outside diameter (mm or in). */
  Do: number;
  /** Nominal wall thickness (mm or in). */
  tn: number;
  /** Bend radius to centerline (mm or in). For bends only. */
  R?: number;
  /** Miter spacing (center-to-center) for miter bends. */
  s?: number;
  /** Miter cut angle in degrees (θ). */
  theta?: number;
  /** Branch outside diameter. For tees. */
  Db?: number;
  /** Branch wall thickness. For tees. */
  tb?: number;
  /** Pad or saddle thickness for reinforced tees. */
  tr?: number;
  /** Reducer cone half-angle in degrees. */
  alpha?: number;
  /** Larger end diameter for reducer. */
  D1?: number;
  /** Smaller end diameter for reducer. */
  D2?: number;
}

/** Result from a SIF calculation. */
export interface SifResult {
  /** In-plane SIF (ii). */
  ii: number;
  /** Out-of-plane SIF (io). */
  io: number;
  /** Flexibility factor (k). */
  k: number;
  /** Flexibility characteristic (h). */
  h: number;
}

/**
 * Calculate the flexibility characteristic h for a given component.
 * h is the fundamental parameter from which SIF and k are derived.
 */
function flexCharacteristic(params: SifParams, type: ComponentType): number {
  const { Do, tn, R, s, theta } = params;

  switch (type) {
    case "bend": {
      if (!R) throw new Error("Bend radius R is required for bend SIF");
      // h = t·R / r² where r = Do/2 (mean radius approximation)
      // Per B31.3: h = T·R / r²  with T = tn, r = Do/2
      const r = Do / 2;
      return (tn * R) / (r * r);
    }

    case "closely_spaced_miter": {
      // Closely spaced: s < r(1 + tan θ)
      // h = s·T / (2·r²)
      if (s === undefined || theta === undefined)
        throw new Error("s and theta required for closely spaced miter");
      const r = Do / 2;
      return (s * tn) / (2 * r * r);
    }

    case "widely_spaced_miter": {
      // h = T / (r · tan θ)  (single miter formula)
      if (theta === undefined)
        throw new Error("theta required for widely spaced miter");
      const r = Do / 2;
      const thetaRad = (theta * Math.PI) / 180;
      return tn / (r * Math.tan(thetaRad));
    }

    case "welding_tee":
      // Per B31.3 Table D300: h = 4.4 T/r for welding tees
      return (4.4 * tn) / (Do / 2);

    case "reinforced_tee": {
      // h = (T + 0.5·tr) / r  (with pad/saddle reinforcement)
      const tr = params.tr ?? 0;
      return (tn + 0.5 * tr) / (Do / 2);
    }

    case "unreinforced_tee":
      // h = T / r
      return tn / (Do / 2);

    case "weld_neck_flange":
    case "slip_on_flange":
    case "lap_joint_flange":
    case "threaded_joint":
    case "socket_weld":
    case "butt_weld":
      // These have fixed SIF values; h is not really used
      // but we return a nominal value for consistency
      return 1.0;

    case "reducer": {
      // h = T / (r · tan α)  approximate
      if (params.alpha === undefined)
        throw new Error("Cone angle alpha required for reducer SIF");
      const r = Do / 2;
      const alphaRad = (params.alpha * Math.PI) / 180;
      return tn / (r * Math.tan(alphaRad));
    }

    default:
      return 1.0;
  }
}

/**
 * Calculate SIF for a pipe bend (elbow).
 * Per ASME B31.3 Appendix D:
 *   h = T·R / r²
 *   ii = 0.9 / h^(2/3)  (in-plane)
 *   io = 0.75 / h^(2/3) (out-of-plane)
 *   k  = 1.65 / h       (flexibility factor)
 *
 * All SIFs have a minimum of 1.0.
 */
export function bendSif(Do: number, tn: number, R: number): SifResult {
  const r = Do / 2;
  const h = (tn * R) / (r * r);

  const ii = Math.max(1.0, 0.9 / Math.pow(h, 2 / 3));
  const io = Math.max(1.0, 0.75 / Math.pow(h, 2 / 3));
  const k = Math.max(1.0, 1.65 / h);

  return { ii, io, k, h };
}

/**
 * Calculate SIF for a closely-spaced miter bend.
 * s < r(1 + tan θ)
 *   h = s·T / (2·r²)
 *   ii = 0.9 / h^(2/3)
 *   io = 0.75 / h^(2/3)
 */
export function closelySpacedMiterSif(
  Do: number,
  tn: number,
  s: number,
): SifResult {
  const r = Do / 2;
  const h = (s * tn) / (2 * r * r);

  const ii = Math.max(1.0, 0.9 / Math.pow(h, 2 / 3));
  const io = Math.max(1.0, 0.75 / Math.pow(h, 2 / 3));
  const k = Math.max(1.0, 1.65 / h);

  return { ii, io, k, h };
}

/**
 * Calculate SIF for a widely-spaced (single) miter bend.
 *   h = T / (r · tan θ)
 *   ii = 0.9 / h^(2/3)
 *   io = 0.75 / h^(2/3)
 */
export function widelySpacedMiterSif(
  Do: number,
  tn: number,
  theta: number,
): SifResult {
  const r = Do / 2;
  const thetaRad = (theta * Math.PI) / 180;
  const h = tn / (r * Math.tan(thetaRad));

  const ii = Math.max(1.0, 0.9 / Math.pow(h, 2 / 3));
  const io = Math.max(1.0, 0.75 / Math.pow(h, 2 / 3));
  const k = Math.max(1.0, 1.65 / h);

  return { ii, io, k, h };
}

/**
 * Calculate SIF for a welding tee (per B31.3 Table D300).
 *   ii = 0.9 / h^(2/3)  with h = 4.4·T/r
 *   io = 0.75 / h^(2/3)
 */
export function weldingTeeSif(Do: number, tn: number): SifResult {
  const r = Do / 2;
  const h = (4.4 * tn) / r;

  const ii = Math.max(1.0, 0.9 / Math.pow(h, 2 / 3));
  const io = Math.max(1.0, 0.75 / Math.pow(h, 2 / 3));
  const k = 1.0; // tees: k = 1.0 (rigid)

  return { ii, io, k, h };
}

/**
 * Calculate SIF for an unreinforced fabricated tee.
 * Per B31.3: higher SIFs due to lack of reinforcement.
 *   io = 0.9 / h^(2/3)  with h = T/r
 *   ii = 0.75·io + 0.25  (approximate per code)
 *
 * Note: B31.3 gives specific formulas; this is a common simplification.
 */
export function unreinforcedTeeSif(Do: number, tn: number): SifResult {
  const r = Do / 2;
  const h = tn / r;

  const io = Math.max(1.0, 0.9 / Math.pow(h, 2 / 3));
  const ii = Math.max(1.0, (3.1 / Math.pow(h, 2 / 3)) * 0.9);
  const k = 1.0;

  return { ii, io, k, h };
}

/**
 * Calculate SIF for a reinforced fabricated tee (with pad or saddle).
 *   h = (T + 0.5·tr) / r
 *   ii = 0.9 / h^(2/3)
 *   io = 0.75 / h^(2/3)
 */
export function reinforcedTeeSif(
  Do: number,
  tn: number,
  tr: number,
): SifResult {
  const r = Do / 2;
  const h = (tn + 0.5 * tr) / r;

  const ii = Math.max(1.0, 0.9 / Math.pow(h, 2 / 3));
  const io = Math.max(1.0, 0.75 / Math.pow(h, 2 / 3));
  const k = 1.0;

  return { ii, io, k, h };
}

/**
 * Fixed SIF values for common components per B31.3 Table D300.
 */
const FIXED_SIFS: Record<string, SifResult> = {
  butt_weld: { ii: 1.0, io: 1.0, k: 1.0, h: 1.0 },
  socket_weld: { ii: 2.1, io: 2.1, k: 1.0, h: 1.0 },
  threaded_joint: { ii: 2.3, io: 2.3, k: 1.0, h: 1.0 },
  weld_neck_flange: { ii: 1.0, io: 1.0, k: 1.0, h: 1.0 },
  slip_on_flange: { ii: 1.2, io: 1.2, k: 1.0, h: 1.0 },
  lap_joint_flange: { ii: 1.6, io: 1.6, k: 1.0, h: 1.0 },
};

/**
 * Main SIF calculation dispatcher.
 * Routes to the appropriate calculation based on component type.
 */
export function calculateSif(type: ComponentType, params: SifParams): SifResult {
  // Check for fixed SIF components first
  if (type in FIXED_SIFS) {
    return FIXED_SIFS[type];
  }

  switch (type) {
    case "bend":
      if (!params.R) throw new Error("Bend radius R required");
      return bendSif(params.Do, params.tn, params.R);

    case "closely_spaced_miter":
      if (params.s === undefined) throw new Error("Miter spacing s required");
      return closelySpacedMiterSif(params.Do, params.tn, params.s);

    case "widely_spaced_miter":
      if (params.theta === undefined) throw new Error("Miter angle theta required");
      return widelySpacedMiterSif(params.Do, params.tn, params.theta);

    case "welding_tee":
      return weldingTeeSif(params.Do, params.tn);

    case "unreinforced_tee":
      return unreinforcedTeeSif(params.Do, params.tn);

    case "reinforced_tee":
      return reinforcedTeeSif(params.Do, params.tn, params.tr ?? 0);

    case "reducer": {
      // Simplified reducer SIF
      if (params.alpha === undefined) throw new Error("Cone angle alpha required");
      const r = params.Do / 2;
      const alphaRad = (params.alpha * Math.PI) / 180;
      const h = params.tn / (r * Math.tan(alphaRad));
      const ii = Math.max(1.0, 0.9 / Math.pow(h, 2 / 3));
      const io = Math.max(1.0, 0.75 / Math.pow(h, 2 / 3));
      return { ii, io, k: 1.0, h };
    }

    default:
      return { ii: 1.0, io: 1.0, k: 1.0, h: 1.0 };
  }
}

/** Utility: calculate h for convenience. */
export { flexCharacteristic };
