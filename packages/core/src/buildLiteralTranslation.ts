import type { ExplainedToken } from "./types.js";

export function buildLiteralTranslation(tokens: ExplainedToken[]): string {
  return tokens
    .filter((token) => token.kind !== "punctuation")
    .map((token) => token.direct || token.surface)
    .join(" / ");
}
