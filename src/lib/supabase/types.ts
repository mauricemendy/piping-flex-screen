/**
 * Supabase database types for piping-flex-screen.
 *
 * Table: screening_calculations
 * Stores saved screening calculation inputs and results.
 */

export interface ScreeningCalculationRow {
  id: string;
  created_at: string;
  name: string;
  // Input parameters
  code: string;
  material: string;
  nps: string;
  schedule: string;
  do_mm: number;
  tn_mm: number;
  t1_degc: number;
  t2_degc: number;
  l_m: number;
  u_m: number;
  y_manual_mm: number | null;
  y_additional_mm: number;
  // Computed results
  analysis_required: boolean;
  ratio: number;
  utilization: number;
  y_total_mm: number;
  thermal_expansion_mm_m: number;
  sa_mpa: number;
}

export interface ScreeningCalculationInsert {
  name: string;
  code: string;
  material: string;
  nps: string;
  schedule: string;
  do_mm: number;
  tn_mm: number;
  t1_degc: number;
  t2_degc: number;
  l_m: number;
  u_m: number;
  y_manual_mm: number | null;
  y_additional_mm: number;
  analysis_required: boolean;
  ratio: number;
  utilization: number;
  y_total_mm: number;
  thermal_expansion_mm_m: number;
  sa_mpa: number;
}

export interface Database {
  public: {
    Tables: {
      screening_calculations: {
        Row: ScreeningCalculationRow;
        Insert: ScreeningCalculationInsert;
        Update: Partial<ScreeningCalculationInsert>;
      };
    };
  };
}
