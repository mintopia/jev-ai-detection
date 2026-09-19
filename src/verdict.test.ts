import { describe, it, expect } from "vitest";
import { verdictFromNoul } from "./verdict.js";

describe("verdictFromNoul", () => {
  it("returns Yes at or above 0.5", () => {
    expect(verdictFromNoul(0.5)).toBe("Yes");
    expect(verdictFromNoul(0.9)).toBe("Yes");
    expect(verdictFromNoul(1)).toBe("Yes");
  });

  it("returns No below 0.5", () => {
    expect(verdictFromNoul(0.49)).toBe("No");
    expect(verdictFromNoul(0)).toBe("No");
  });
});
