import { describe, it, expect } from "vitest";
import { parseDecisionsResponse } from "./jev.js";

const good = {
  answers: {
    is_ai: { type: "noul", noul: 0.59 },
    which_ai: { type: "choice", choice: "human", probabilities: { human: 0.47, gpt: 0.37 } },
  },
  usage: { input_tokens: 288, output_tokens: 21 },
};

describe("parseDecisionsResponse", () => {
  it("extracts noul, choice, probabilities, and token usage from a live-shaped response", () => {
    expect(parseDecisionsResponse(good)).toEqual({
      isAiNoul: 0.59,
      whichAi: "human",
      probabilities: { human: 0.47, gpt: 0.37 },
      inputTokens: 288,
      outputTokens: 21,
    });
  });

  it("defaults token usage to zero when the usage block is missing", () => {
    const { usage, ...noUsage } = good;
    void usage;
    expect(parseDecisionsResponse(noUsage)).toMatchObject({ inputTokens: 0, outputTokens: 0 });
  });

  it("throws when noul is missing", () => {
    const bad = { answers: { is_ai: {}, which_ai: good.answers.which_ai } };
    expect(() => parseDecisionsResponse(bad)).toThrow(/unexpected/);
  });

  it("throws when the choice is not a known label", () => {
    const bad = { answers: { ...good.answers, which_ai: { choice: "banana", probabilities: {} } } };
    expect(() => parseDecisionsResponse(bad)).toThrow(/unexpected/);
  });

  it("throws on a totally malformed payload", () => {
    expect(() => parseDecisionsResponse({ error: "nope" })).toThrow(/unexpected/);
  });
});
