import { describe, it, expect } from "vitest";
import { verdictFromNoul } from "./verdict.js";

describe("verdictFromNoul", () => {
  it("returns Yes above 0.6", () => {
    expect(verdictFromNoul(0.61)).toBe("Yes");
    expect(verdictFromNoul(0.9)).toBe("Yes");
    expect(verdictFromNoul(1)).toBe("Yes");
  });

  it("returns No below 0.4", () => {
    expect(verdictFromNoul(0.39)).toBe("No");
    expect(verdictFromNoul(0)).toBe("No");
  });

  it("returns Uncertain in the 0.4–0.6 band, inclusive of both edges", () => {
    expect(verdictFromNoul(0.4)).toBe("Uncertain");
    expect(verdictFromNoul(0.5)).toBe("Uncertain");
    expect(verdictFromNoul(0.6)).toBe("Uncertain");
  });
});
