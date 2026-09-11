/**
 * OpenAI provider.
 *
 * Plain `fetch` against the Chat Completions API — the whole surface we use is
 * one endpoint, and going through the SDK would put a dependency in the way of
 * swapping providers later.
 *
 * Architecture rule 4: the AI client lives here and nowhere else.
 */

import type { AiProvider, AiRequest } from "./provider";

const ENDPOINT = "https://api.openai.com/v1/chat/completions";
const DEFAULT_TIMEOUT_MS = 20_000;

export function createOpenAiProvider(apiKey: string, model: string): AiProvider {
  return {
    name: "openai",
    model,

    async complete<T>(request: AiRequest): Promise<T | null> {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        request.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      );

      try {
        const response = await fetch(ENDPOINT, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            max_tokens: request.maxTokens ?? 700,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: `${request.system}\n\n${request.schemaHint}` },
              { role: "user", content: request.prompt },
            ],
          }),
        });

        if (!response.ok) return null;

        const body = (await response.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = body.choices?.[0]?.message?.content;
        if (!content) return null;

        return JSON.parse(content) as T;
      } catch {
        // Timeouts, network failures and malformed JSON all mean the same
        // thing here: carry on without the AI layer.
        return null;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
