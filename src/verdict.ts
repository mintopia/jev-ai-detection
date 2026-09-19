export type Verdict = "Yes" | "No";

export function verdictFromNoul(noul: number): Verdict {
  return noul >= 0.5 ? "Yes" : "No";
}
