/**
 * Standard NPS pipe sizes with OD and schedule wall thicknesses.
 * All dimensions in mm. Source: ASME B36.10M / B36.19M.
 */

export interface PipeSchedule {
  name: string;
  tn: number; // wall thickness in mm
}

export interface NominalPipeSize {
  nps: string;    // e.g. "2", "6", "12"
  Do: number;     // outside diameter in mm
  schedules: PipeSchedule[];
}

export const PIPE_SIZES: NominalPipeSize[] = [
  {
    nps: "1/2\"",
    Do: 21.3,
    schedules: [
      { name: "Sch 5S", tn: 1.65 },
      { name: "Sch 10S", tn: 2.11 },
      { name: "Sch 40 (Std)", tn: 2.77 },
      { name: "Sch 80 (XS)", tn: 3.73 },
    ],
  },
  {
    nps: "3/4\"",
    Do: 26.7,
    schedules: [
      { name: "Sch 5S", tn: 1.65 },
      { name: "Sch 10S", tn: 2.11 },
      { name: "Sch 40 (Std)", tn: 2.87 },
      { name: "Sch 80 (XS)", tn: 3.91 },
    ],
  },
  {
    nps: "1\"",
    Do: 33.4,
    schedules: [
      { name: "Sch 5S", tn: 1.65 },
      { name: "Sch 10S", tn: 2.77 },
      { name: "Sch 40 (Std)", tn: 3.38 },
      { name: "Sch 80 (XS)", tn: 4.55 },
    ],
  },
  {
    nps: "1-1/2\"",
    Do: 48.3,
    schedules: [
      { name: "Sch 5S", tn: 1.65 },
      { name: "Sch 10S", tn: 2.77 },
      { name: "Sch 40 (Std)", tn: 3.68 },
      { name: "Sch 80 (XS)", tn: 5.08 },
    ],
  },
  {
    nps: "2\"",
    Do: 60.3,
    schedules: [
      { name: "Sch 5S", tn: 1.65 },
      { name: "Sch 10S", tn: 2.77 },
      { name: "Sch 40 (Std)", tn: 3.91 },
      { name: "Sch 80 (XS)", tn: 5.54 },
    ],
  },
  {
    nps: "3\"",
    Do: 88.9,
    schedules: [
      { name: "Sch 5S", tn: 1.65 },
      { name: "Sch 10S", tn: 3.05 },
      { name: "Sch 40 (Std)", tn: 5.49 },
      { name: "Sch 80 (XS)", tn: 7.62 },
    ],
  },
  {
    nps: "4\"",
    Do: 114.3,
    schedules: [
      { name: "Sch 5S", tn: 1.65 },
      { name: "Sch 10S", tn: 3.05 },
      { name: "Sch 40 (Std)", tn: 6.02 },
      { name: "Sch 80 (XS)", tn: 8.56 },
      { name: "Sch 120", tn: 11.13 },
      { name: "Sch 160", tn: 13.49 },
    ],
  },
  {
    nps: "6\"",
    Do: 168.3,
    schedules: [
      { name: "Sch 5S", tn: 1.65 },
      { name: "Sch 10S", tn: 3.40 },
      { name: "Sch 40 (Std)", tn: 7.11 },
      { name: "Sch 80 (XS)", tn: 10.97 },
      { name: "Sch 120", tn: 14.27 },
      { name: "Sch 160", tn: 18.26 },
    ],
  },
  {
    nps: "8\"",
    Do: 219.1,
    schedules: [
      { name: "Sch 5S", tn: 2.77 },
      { name: "Sch 10S", tn: 3.76 },
      { name: "Sch 20", tn: 6.35 },
      { name: "Sch 40 (Std)", tn: 8.18 },
      { name: "Sch 80 (XS)", tn: 12.70 },
      { name: "Sch 120", tn: 18.26 },
      { name: "Sch 160", tn: 23.01 },
    ],
  },
  {
    nps: "10\"",
    Do: 273.1,
    schedules: [
      { name: "Sch 5S", tn: 3.40 },
      { name: "Sch 10S", tn: 4.19 },
      { name: "Sch 20", tn: 6.35 },
      { name: "Sch 40 (Std)", tn: 9.27 },
      { name: "Sch 80 (XS)", tn: 12.70 },
      { name: "Sch 120", tn: 21.44 },
      { name: "Sch 160", tn: 28.58 },
    ],
  },
  {
    nps: "12\"",
    Do: 323.8,
    schedules: [
      { name: "Sch 5S", tn: 3.96 },
      { name: "Sch 10S", tn: 4.57 },
      { name: "Sch 20", tn: 6.35 },
      { name: "Sch 40 (Std)", tn: 10.31 },
      { name: "Sch 80 (XS)", tn: 12.70 },
      { name: "Sch 120", tn: 25.40 },
      { name: "Sch 160", tn: 33.32 },
    ],
  },
  {
    nps: "14\"",
    Do: 355.6,
    schedules: [
      { name: "Sch 5S", tn: 3.96 },
      { name: "Sch 10S", tn: 4.78 },
      { name: "Sch 20", tn: 7.92 },
      { name: "Sch 30 (Std)", tn: 9.53 },
      { name: "Sch 40", tn: 11.13 },
      { name: "Sch 80 (XS)", tn: 12.70 },
    ],
  },
  {
    nps: "16\"",
    Do: 406.4,
    schedules: [
      { name: "Sch 5S", tn: 4.19 },
      { name: "Sch 10S", tn: 4.78 },
      { name: "Sch 20", tn: 7.92 },
      { name: "Sch 30 (Std)", tn: 9.53 },
      { name: "Sch 40", tn: 12.70 },
      { name: "Sch 80 (XS)", tn: 12.70 },
    ],
  },
  {
    nps: "18\"",
    Do: 457.2,
    schedules: [
      { name: "Sch 5S", tn: 4.19 },
      { name: "Sch 10S", tn: 4.78 },
      { name: "Sch 20", tn: 7.92 },
      { name: "Sch 30 (Std)", tn: 9.53 },
      { name: "Sch 40", tn: 14.27 },
      { name: "Sch 80 (XS)", tn: 12.70 },
    ],
  },
  {
    nps: "20\"",
    Do: 508.0,
    schedules: [
      { name: "Sch 5S", tn: 4.78 },
      { name: "Sch 10S", tn: 5.54 },
      { name: "Sch 20 (Std)", tn: 9.53 },
      { name: "Sch 40", tn: 15.09 },
      { name: "Sch 80 (XS)", tn: 12.70 },
    ],
  },
  {
    nps: "24\"",
    Do: 609.6,
    schedules: [
      { name: "Sch 5S", tn: 5.54 },
      { name: "Sch 10S", tn: 6.35 },
      { name: "Sch 20 (Std)", tn: 9.53 },
      { name: "Sch 40", tn: 17.48 },
      { name: "Sch 80 (XS)", tn: 12.70 },
    ],
  },
];

/** Find a pipe size by NPS string. */
export function findPipeSize(nps: string): NominalPipeSize | undefined {
  return PIPE_SIZES.find((p) => p.nps === nps);
}
