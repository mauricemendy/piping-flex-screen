import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { type ScreeningResult } from "@/lib/engine/calculator";
import { type FormData } from "@/components/screening-form";

// ─── Colors ─────────────────────────────────────────────────────────────────
type RGB = [number, number, number];
const TEAL: RGB = [13, 148, 136];     // #0D9488
const RED: RGB = [220, 38, 38];       // #DC2626
const DARK: RGB = [17, 24, 39];       // #111827
const GRAY: RGB = [107, 114, 128];    // #6B7280
const LIGHT_BG: RGB = [243, 244, 246]; // #F3F4F6

/**
 * Generate a professional PDF screening report.
 */
export function generateScreeningPDF(
  formData: FormData,
  result: ScreeningResult,
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // ── Header band ──
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageWidth, 32, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Flex Screen — Piping Flexibility Screening", margin, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  const codeSection = result.code === "B31.1" ? "§119.7.1" : "§319.4.1";
  doc.text(
    `ASME ${result.code} ${codeSection}  |  Generated ${new Date().toISOString().slice(0, 10)}`,
    margin,
    22,
  );

  y = 42;

  // ── Verdict banner ──
  const pass = !result.analysisRequired;
  const verdictColor = pass ? TEAL : RED;
  const verdict = pass ? "PASS — No Formal Analysis Required" : "FAIL — Formal Analysis Required";

  doc.setFillColor(...verdictColor);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(verdict, pageWidth / 2, y + 10.5, { align: "center" });

  doc.setFontSize(9);
  doc.text(
    `Utilization: ${(result.utilization * 100).toFixed(1)}%`,
    pageWidth - margin - 2,
    y + 10.5,
    { align: "right" },
  );

  y += 24;

  // ── Screening Criterion box ──
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  const criterionRef = result.code === "B31.1" ? "§119.7.1(A)" : "§319.4.1(c)";
  doc.text(`Screening Criterion (${criterionRef}):`, margin + 4, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);

  const ratioStr = result.ratio === Infinity ? "∞" : result.ratio.toFixed(1);
  const criterionText = `D·y / (L − U)² = ${ratioStr}  ${pass ? "≤" : ">"} K₁ = ${result.K1}`;
  doc.text(criterionText, margin + 4, y + 14);

  y += 28;

  // ── Section: Input Parameters ──
  y = sectionHeading(doc, "Input Parameters", margin, y);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Parameter", "Value", "Unit"]],
    body: [
      ["Piping Code", result.code, ""],
      ["Material", formData.material, ""],
      ["Nominal Pipe Size", formData.nps, ""],
      ["Schedule", formData.schedule, ""],
      ["Outside Diameter (Do)", formData.Do.toFixed(1), "mm"],
      ["Wall Thickness (tn)", formData.tn.toFixed(2), "mm"],
      ["Design Temperature (T1)", formData.T1.toString(), "°C"],
      ["Ambient Temperature (T2)", formData.T2.toString(), "°C"],
      ["Developed Length (L)", formData.L.toString(), "m"],
      ["Anchor Distance (U)", formData.U.toString(), "m"],
      ["Effective Length (L − U)", result.effectiveLength.toFixed(2), "m"],
    ],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: {
      fillColor: DARK,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { halign: "right", fontStyle: "bold", cellWidth: 50 },
      2: { cellWidth: 20, halign: "left", textColor: GRAY },
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Section: Computed Results ──
  y = sectionHeading(doc, "Computed Results", margin, y);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Property", "Value", "Unit"]],
    body: [
      ["Thermal Expansion (α·ΔT)", result.thermalExpansion.toFixed(3), "mm/m"],
      ["Total Displacement (y)", result.y.toFixed(1), "mm"],
      ["Screening Ratio (D·y/(L−U)²)", ratioStr, "mm²/m²"],
      ["Threshold (K₁)", result.K1.toString(), "mm²/m²"],
      ["Utilization", `${(result.utilization * 100).toFixed(1)}%`, ""],
    ],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: {
      fillColor: DARK,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { halign: "right", fontStyle: "bold", cellWidth: 50 },
      2: { cellWidth: 30, halign: "left", textColor: GRAY },
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Section: Material Properties ──
  y = sectionHeading(doc, "Material Properties", margin, y);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Property", "Value", "Unit"]],
    body: [
      ["E at Ambient (Ea)", result.Ea.toString(), "MPa"],
      ["E at Design (Ec)", result.Ec.toString(), "MPa"],
      ["Sc (allowable at ambient)", result.Sc.toFixed(1), "MPa"],
      ["Sh (allowable at design)", result.Sh.toFixed(1), "MPa"],
      ["SA (displacement stress range)", result.SA.toFixed(1), "MPa"],
    ],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: {
      fillColor: DARK,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { halign: "right", fontStyle: "bold", cellWidth: 50 },
      2: { cellWidth: 30, halign: "left", textColor: GRAY },
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // ── Recommendation (if FAIL) ──
  if (result.analysisRequired) {
    const Leff = result.effectiveLength;
    const neededLeff = Math.sqrt((formData.Do * result.y) / result.K1);
    const Lmin = neededLeff + formData.U;

    doc.setFillColor(255, 241, 242); // light red bg
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...RED);
    doc.text("Recommendation", margin + 4, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    doc.text(
      `To pass screening, increase developed length L to at least ${Lmin.toFixed(1)} m ` +
        `(effective length ${neededLeff.toFixed(1)} m vs current ${Leff.toFixed(1)} m), ` +
        `or add expansion loops / flexible joints.`,
      margin + 4,
      y + 13,
      { maxWidth: contentWidth - 8 },
    );

    y += 30;
  }

  // ── Footer ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(
    `Flex Screen — ASME ${result.code} Flexibility Screening Tool  |  This report is for preliminary screening only.`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" },
  );
  doc.text(
    `Formal flexibility analysis per ${result.code === "B31.1" ? "§119.7" : "§319.4.4"} is recommended for all final designs.`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 6,
    { align: "center" },
  );

  // ── Download ──
  const fileName = `flex-screen_${formData.nps.replace('"', "in")}_${formData.T1}C_${pass ? "PASS" : "FAIL"}.pdf`;
  doc.save(fileName);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sectionHeading(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(text, x, y);

  doc.setDrawColor(229, 231, 235); // #E5E7EB
  doc.setLineWidth(0.3);
  doc.line(x, y + 1.5, x + 170, y + 1.5);

  return y + 6;
}
