const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const FALLBACK_MODELS = [
  "arcee-ai/trinity-large-preview:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "mistralai/codestral:free",
];

export async function callOpenRouter(
  messages: ChatMessage[],
  model?: string,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const defaultModel =
    model ||
    process.env.OPENROUTER_MODEL ||
    "arcee-ai/trinity-large-preview:free";
  const modelsToTry = [
    defaultModel,
    ...FALLBACK_MODELS.filter((m) => m !== defaultModel),
  ];

  let lastError: any = null;

  for (const tryModel of modelsToTry) {
    try {
      console.log(`Attempting model: ${tryModel}`);
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer":
            process.env.OPENROUTER_REFERER || "http://localhost:3000",
          "X-Title": process.env.OPENROUTER_APP_NAME || "AI Chatboard",
        },
        body: JSON.stringify({
          model: tryModel,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errorMessage =
          errData?.error?.message ||
          res.statusText ||
          "OpenRouter request failed";

        // Check for guardrail restrictions
        if (
          errorMessage.includes("guardrail") ||
          errorMessage.includes("restrictions") ||
          errorMessage.includes("data policy") ||
          res.status === 400
        ) {
          lastError = new Error(errorMessage);
          console.warn(
            `Model ${tryModel} blocked by guardrails, trying next...`,
          );
          continue; // try next model
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (data?.choices?.[0]?.message?.content)
        return data.choices[0].message.content;
      if (data?.choices?.[0]?.text) return data.choices[0].text;
      throw new Error("Unexpected response format from OpenRouter");
    } catch (err: any) {
      console.warn(`Model ${tryModel} failed:`, err.message);
      lastError = err;
      // If it's not a guardrail error, break and return
      if (
        !err.message.includes("guardrail") &&
        !err.message.includes("restrictions") &&
        !err.message.includes("data policy")
      ) {
        break;
      }
      // otherwise continue to next model
    }
  }

  // All models failed
  const errorMessage =
    lastError?.message || "All models failed due to restrictions";
  if (
    errorMessage.includes("guardrail") ||
    errorMessage.includes("restrictions") ||
    errorMessage.includes("data policy")
  ) {
    throw new Error(
      `${errorMessage}. Please check your OpenRouter privacy settings: https://openrouter.ai/settings/privacy. Try using a free model like Trinity Large Preview.`,
    );
  }
  throw lastError;
}
