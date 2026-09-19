export type Verdict = "Yes" | "No" | "Uncertain";

export function verdictFromNoul(noul: number): Verdict {
  if (noul > 0.6) return "Yes";
  if (noul < 0.4) return "No";
  return "Uncertain";
}
