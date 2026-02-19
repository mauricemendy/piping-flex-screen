import { getSupabaseClient, isSupabaseConfigured } from "./client";
import {
  type ScreeningCalculationRow,
  type ScreeningCalculationInsert,
} from "./types";
export type { ScreeningCalculationRow } from "./types";
import { type FormData } from "@/components/screening-form";
import { type ScreeningResult } from "@/lib/engine/calculator";

/**
 * Save a screening calculation to Supabase.
 * Returns the saved row or null if Supabase is not configured.
 */
export async function saveScreening(
  name: string,
  formData: FormData,
  result: ScreeningResult,
): Promise<ScreeningCalculationRow | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const insert: ScreeningCalculationInsert = {
    name,
    code: formData.code,
    material: formData.material,
    nps: formData.nps,
    schedule: formData.schedule,
    do_mm: formData.Do,
    tn_mm: formData.tn,
    t1_degc: formData.T1,
    t2_degc: formData.T2,
    l_m: formData.L,
    u_m: formData.U,
    y_manual_mm: formData.yManual ? parseFloat(formData.yManual) : null,
    y_additional_mm: formData.yAdditional,
    analysis_required: result.analysisRequired,
    ratio: result.ratio === Infinity ? 9999 : result.ratio,
    utilization: result.utilization === Infinity ? 9999 : result.utilization,
    y_total_mm: result.y,
    thermal_expansion_mm_m: result.thermalExpansion,
    sa_mpa: result.SA,
  };

  const { data, error } = await client
    .from("screening_calculations")
    .insert(insert)
    .select()
    .single();

  if (error) {
    console.error("Failed to save screening:", error.message);
    return null;
  }

  return data;
}

/**
 * Load recent screening calculations from Supabase.
 * Returns empty array if Supabase is not configured.
 */
export async function loadScreenings(
  limit: number = 20,
): Promise<ScreeningCalculationRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("screening_calculations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load screenings:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Delete a screening calculation by ID.
 */
export async function deleteScreening(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { error } = await client
    .from("screening_calculations")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete screening:", error.message);
    return false;
  }

  return true;
}

/**
 * Convert a saved row back to FormData for loading into the form.
 */
export function rowToFormData(row: ScreeningCalculationRow): FormData {
  return {
    code: row.code as FormData["code"],
    material: row.material,
    nps: row.nps,
    schedule: row.schedule,
    Do: row.do_mm,
    tn: row.tn_mm,
    T1: row.t1_degc,
    T2: row.t2_degc,
    L: row.l_m,
    U: row.u_m,
    yManual: row.y_manual_mm !== null ? String(row.y_manual_mm) : "",
    yAdditional: row.y_additional_mm,
  };
}
