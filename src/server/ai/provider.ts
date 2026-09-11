/**
 * The AI provider interface.
 *
 * The product must work with this layer disabled (spec section 16), so every
 * call site treats AI output as optional. Providers implement one method:
 * given a prompt and a JSON schema shape, return parsed JSON or null.
 */

export interface AiProvider {
  readonly name: string;
  readonly model: string;
  /**
   * Returns parsed JSON matching the requested shape, or null if the provider
   * is unavailable, times out, or returns something unusable. Implementations
   * must not throw — a missing AI layer is a degraded feature, not an error.
   */
  complete<T>(request: AiRequest): Promise<T | null>;
}

export interface AiRequest {
  /** What the model is being asked to do, and the rules it must follow. */
  system: string;
  /** The observed data, already trimmed to fit. */
  prompt: string;
  /** Shape description included in the prompt to force well-formed JSON. */
  schemaHint: string;
  maxTokens?: number;
  timeoutMs?: number;
}

/** A provider that is always unavailable. Used when AI is switched off. */
export const disabledProvider: AiProvider = {
  name: "disabled",
  model: "none",
  async complete() {
    return null;
  },
};
