const DECISIONS_URL = "https://openrouter.ai/api/alpha/decisions";
const MODEL = "typesafe/jev-1.13";

export const WHICH_AI_LABELS = ["human", "claude", "gpt", "gemini", "grok", "other"] as const;
export type WhichAiLabel = (typeof WHICH_AI_LABELS)[number];

export interface JevResult {
  isAiNoul: number;
  whichAi: WhichAiLabel;
  probabilities: Record<string, number>;
}

function isWhichAiLabel(v: unknown): v is WhichAiLabel {
  return typeof v === "string" && (WHICH_AI_LABELS as readonly string[]).includes(v);
}

export function parseDecisionsResponse(data: unknown): JevResult {
  const answers = (data as { answers?: unknown })?.answers as
    | { is_ai?: { noul?: unknown }; which_ai?: { choice?: unknown; probabilities?: unknown } }
    | undefined;

  const noul = answers?.is_ai?.noul;
  const choice = answers?.which_ai?.choice;
  const probabilities = answers?.which_ai?.probabilities;

  if (typeof noul !== "number" || !isWhichAiLabel(choice) || typeof probabilities !== "object" || probabilities === null) {
    throw new Error(`Jev response shape unexpected: ${JSON.stringify(data).slice(0, 500)}`);
  }

  return { isAiNoul: noul, whichAi: choice, probabilities: probabilities as Record<string, number> };
}

export async function analyzeText(text: string, apiKey: string): Promise<JevResult> {
  const body = {
    model: MODEL,
    state: text,
    questions: {
      is_ai: {
        type: "noul",
        instructions: "Is this text written by an AI? 1 means definitely AI, 0 means definitely human.",
      },
      which_ai: {
        type: "choice",
        instructions: "Which AI most likely wrote this text?",
        criteria: {
          human: "A human wrote this text.",
          claude: "Anthropic's Claude wrote this text.",
          gpt: "OpenAI's GPT wrote this text.",
          gemini: "Google's Gemini wrote this text.",
          grok: "xAI's Grok wrote this text.",
          other: "Some other AI wrote this text.",
        },
      },
    },
  };

  const res = await fetch(DECISIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Jev decisions API returned ${res.status}: ${detail}`);
  }

  return parseDecisionsResponse(await res.json());
}
