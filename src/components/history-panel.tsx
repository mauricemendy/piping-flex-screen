"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import {
  loadScreenings,
  deleteScreening,
  rowToFormData,
  type ScreeningCalculationRow,
} from "@/lib/supabase/screening-store";
import { type FormData } from "@/components/screening-form";
import { cn } from "@/lib/utils";

// Re-export for convenience
export { saveScreening } from "@/lib/supabase/screening-store";
export { isSupabaseConfigured } from "@/lib/supabase/client";

interface HistoryPanelProps {
  onLoad: (data: FormData) => void;
  refreshKey: number;
}

export function HistoryPanel({ onLoad, refreshKey }: HistoryPanelProps) {
  const [rows, setRows] = useState<ScreeningCalculationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const configured = isSupabaseConfigured();

  const fetchData = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await loadScreenings(15);
    setRows(data);
    setLoading(false);
  }, [configured]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  if (!configured) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-[13px] text-[#9CA3AF]">
            Set <code className="text-[12px] bg-[#F3F4F6] px-1.5 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-[12px] bg-[#F3F4F6] px-1.5 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            to enable saving calculations.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-[13px] text-[#9CA3AF]">Loading saved calculations...</p>
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-[13px] text-[#9CA3AF]">No saved calculations yet.</p>
        </CardContent>
      </Card>
    );
  }

  async function handleDelete(id: string) {
    await deleteScreening(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#9CA3AF]">
          Saved Calculations ({rows.length})
        </span>
      </CardHeader>
      <CardContent className="grid gap-2 max-h-[400px] overflow-y-auto">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between rounded-[8px] border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5 hover:bg-[#F3F4F6] transition-colors group"
          >
            <button
              onClick={() => onLoad(rowToFormData(row))}
              className="flex-1 text-left min-w-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-[#111827] truncate">
                  {row.name}
                </span>
                <Badge variant={row.analysis_required ? "fail" : "pass"} className="shrink-0">
                  {row.analysis_required ? "FAIL" : "PASS"}
                </Badge>
              </div>
              <p className="mt-0.5 text-[11px] text-[#9CA3AF] truncate">
                {row.nps} {row.material} — {row.t1_degc}°C — U={row.ratio === 9999 ? "∞" : `${(row.utilization * 100).toFixed(0)}%`}
              </p>
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className="ml-2 p-1 text-[#D1D5DB] hover:text-[#DC2626] opacity-0 group-hover:opacity-100 transition-all"
              title="Delete"
            >
              <svg width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4H3.5C3.22386 4 3 3.77614 3 3.5ZM5 4H10V12H5V4Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
