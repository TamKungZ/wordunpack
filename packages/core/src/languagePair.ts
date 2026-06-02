import { UnsupportedLanguagePairError } from "./errors.js";
import type { LanguageCode } from "./types.js";

const supportedLanguagePairs = new Set([
  "en->th",
  "th->en",
  "ja->th",
  "th->ja",
  "ja->en",
  "en->ja",
]);

export function getLanguagePairKey(
  source: LanguageCode,
  target: LanguageCode,
): string {
  return `${source}->${target}`;
}

export function isSupportedLanguagePair(
  source: LanguageCode,
  target: LanguageCode,
): boolean {
  return supportedLanguagePairs.has(getLanguagePairKey(source, target));
}

export function assertSupportedLanguagePair(
  source: LanguageCode,
  target: LanguageCode,
): void {
  if (!isSupportedLanguagePair(source, target)) {
    throw new UnsupportedLanguagePairError(source, target);
  }
}

export function listSupportedLanguagePairs(): Array<{
  source: LanguageCode;
  target: LanguageCode;
}> {
  return [...supportedLanguagePairs].map((pair) => {
    const [source, target] = pair.split("->") as [LanguageCode, LanguageCode];
    return { source, target };
  });
}
