import type { LanguageCode } from "./types.js";

export class WordUnpackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WordUnpackError";
  }
}

export class ProviderError extends WordUnpackError {
  readonly provider: string;
  readonly status?: number;

  constructor(message: string, options: { provider: string; status?: number }) {
    super(message);
    this.name = "ProviderError";
    this.provider = options.provider;
    this.status = options.status;
  }
}

export class UnsupportedLanguagePairError extends WordUnpackError {
  readonly source: LanguageCode;
  readonly target: LanguageCode;

  constructor(source: LanguageCode, target: LanguageCode) {
    super(`Unsupported language pair: ${source} -> ${target}`);
    this.name = "UnsupportedLanguagePairError";
    this.source = source;
    this.target = target;
  }
}

export class MissingProviderError extends WordUnpackError {
  constructor(kind: string, details: string) {
    super(`Missing ${kind} provider: ${details}`);
    this.name = "MissingProviderError";
  }
}
