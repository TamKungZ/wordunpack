import { getLanguagePairKey } from "./languagePair.js";
import type {
  CreateExplainerOptions,
  ExplainedToken,
  SentenceTranslationProvider,
  TokenGloss,
  TokenTranslationProvider,
  TokenizedToken,
} from "./types.js";

export async function translateNaturally(args: {
  cache: CreateExplainerOptions["translationCache"];
  input: string;
  provider: SentenceTranslationProvider | undefined;
  source: string;
  target: string;
  timeoutMs: number;
  tokens: ExplainedToken[];
  providersUsed: Set<string>;
  warnings: string[];
}): Promise<string | undefined> {
  if (!args.provider) {
    return undefined;
  }

  const cacheKey = ["sentence", getLanguagePairKey(args.source, args.target), args.input].join(":");
  const cached = await args.cache?.get(cacheKey);
  if (cached) {
    return cached;
  }

  const translated = await withTimeout(
    args.provider.translate(args.input, {
      source: args.source,
      target: args.target,
      tokens: args.tokens,
      timeoutMs: args.timeoutMs,
    }),
    args.timeoutMs,
  ).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    pushOnce(
      args.warnings,
      message === "Translation provider timed out"
        ? "Translation provider timed out"
        : `Translation provider failed: ${message}`,
    );
    return undefined;
  });

  if (translated) {
    args.providersUsed.add(args.provider.name);
    await args.cache?.set(cacheKey, translated);
  }

  return translated;
}

export async function translateTokenSafely(args: {
  cache: CreateExplainerOptions["translationCache"];
  input: string;
  provider: TokenTranslationProvider | undefined;
  source: string;
  target: string;
  timeoutMs: number;
  token: TokenizedToken;
  tokens: TokenizedToken[];
  warnings: string[];
  providersUsed: Set<string>;
}): Promise<TokenGloss | undefined> {
  if (!args.provider || args.token.kind === "punctuation") {
    return undefined;
  }

  const text = args.token.baseForm ?? args.token.lemma ?? args.token.surface;
  const cacheKey = ["token", getLanguagePairKey(args.source, args.target), text].join(":");
  const cached = await args.cache?.get(cacheKey);
  if (cached) {
    return {
      direct: cached,
      sourceProvider: args.provider.name,
    };
  }

  const translated = await withTimeout(
    args.provider.translateToken(args.token, {
      source: args.source,
      target: args.target,
      input: args.input,
      tokens: args.tokens,
      timeoutMs: args.timeoutMs,
    }),
    args.timeoutMs,
  ).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    pushOnce(
      args.warnings,
      message === "Translation provider timed out"
        ? "Translation provider timed out"
        : `Token translation provider failed: ${message}`,
    );
    return undefined;
  });

  if (translated?.direct) {
    args.providersUsed.add(args.provider.name);
    await args.cache?.set(cacheKey, translated.direct);
  }

  return translated;
}

export function pushOnce(items: string[], item: string): void {
  if (!items.includes(item)) {
    items.push(item);
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Translation provider timed out")),
      timeoutMs,
    );

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}
