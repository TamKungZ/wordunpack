import { Hono } from "hono";
import type { Context } from "hono";

import {
  createExplainer,
  listSupportedLanguagePairs,
  ProviderError,
  UnsupportedLanguagePairError,
  type CreateExplainerOptions,
  type LanguageCode,
  type SentenceTranslationProvider,
  type TokenTranslationProvider,
} from "@wordunpack/core";
import { JapaneseThaiSeedGlossProvider } from "@wordunpack/gloss-ja-th";
import {
  LibreTranslateProvider,
  LibreTranslateTokenProvider,
} from "@wordunpack/provider-libretranslate";
import { KuromojiTokenizerProvider } from "@wordunpack/tokenizer-ja-kuromoji";

import { MemoryTranslationCache } from "./memoryTranslationCache.js";

export interface ApiEnvironment {
  WORDUNPACK_TRANSLATION_PROVIDER?: string;
  LIBRETRANSLATE_ENDPOINT?: string;
  LIBRETRANSLATE_API_KEY?: string;
}

export interface CreateApiAppOptions extends Partial<CreateExplainerOptions> {
  env?: ApiEnvironment;
}

interface ExplainRequestBody {
  input?: unknown;
  source?: unknown;
  target?: unknown;
  includeNaturalTranslation?: unknown;
  includeTokenTranslation?: unknown;
  timeoutMs?: unknown;
}

export function createApiApp(options: CreateApiAppOptions = {}) {
  const env = options.env ?? process.env;
  const translationProviders = [
    ...(options.sentenceTranslationProviders ?? []),
    ...createEnvironmentTranslationProviders(env),
  ];
  const tokenTranslationProviders = [
    ...(options.tokenTranslationProviders ?? []),
    ...createEnvironmentTokenTranslationProviders(env),
  ];
  const tokenizers = options.tokenizers ?? [new KuromojiTokenizerProvider()];
  const wordMeaningProviders = options.wordMeaningProviders ?? [
    new JapaneseThaiSeedGlossProvider(),
  ];
  const commonOptions = {
    tokenizers,
    wordMeaningProviders,
    translationCache: options.translationCache ?? new MemoryTranslationCache(),
    logger: options.logger,
  };
  const explainer = createExplainer(commonOptions);
  const translationExplainer = createExplainer({
    ...commonOptions,
    sentenceTranslationProviders: translationProviders,
    tokenTranslationProviders,
  });
  const app = new Hono();

  app.get("/languages", (context) => context.json({
    pairs: listSupportedLanguagePairs(),
  }));

  app.post("/explain", async (context) => {
    const body = await context.req.json<ExplainRequestBody>();
    const validation = validateExplainBody(body);
    if (!validation.ok) {
      return context.json({ error: validation.error }, 400);
    }

    try {
      const selectedExplainer = body.includeNaturalTranslation
        || body.includeTokenTranslation
        ? translationExplainer
        : explainer;
      const includeNaturalTranslation = body.includeNaturalTranslation === true;
      const includeTokenTranslation = body.includeTokenTranslation === true;
      const result = await selectedExplainer.explainSentence(validation.input, {
        source: validation.source,
        target: validation.target,
        includeNaturalTranslation,
        includeTokenTranslation,
        timeoutMs: validation.timeoutMs,
      });

      if (
        (includeNaturalTranslation || includeTokenTranslation) &&
        translationProviders.length === 0 &&
        tokenTranslationProviders.length === 0
      ) {
        if (!result.warnings.includes("No translation provider configured")) {
          result.warnings.push("No translation provider configured");
        }
      }

      return context.json(result);
    } catch (error) {
      return respondWithError(context, error);
    }
  });

  app.post("/translate", async (context) => {
    const body = await context.req.json<ExplainRequestBody>();
    const validation = validateExplainBody(body);
    if (!validation.ok) {
      return context.json({ error: validation.error }, 400);
    }

    try {
      const result = await translationExplainer.explainSentence(validation.input, {
        source: validation.source,
        target: validation.target,
        includeNaturalTranslation: true,
        includeTokenTranslation: false,
        timeoutMs: validation.timeoutMs,
      });

      return context.json({
        source: result.source,
        target: result.target,
        translation: result.naturalTranslation,
      });
    } catch (error) {
      return respondWithError(context, error);
    }
  });

  return app;
}

function createEnvironmentTranslationProviders(
  env: ApiEnvironment,
): SentenceTranslationProvider[] {
  if (!shouldUseLibreTranslate(env)) {
    return [];
  }

  return [
    new LibreTranslateProvider({
      endpoint: env.LIBRETRANSLATE_ENDPOINT!,
      apiKey: env.LIBRETRANSLATE_API_KEY,
    }),
  ];
}

function createEnvironmentTokenTranslationProviders(
  env: ApiEnvironment,
): TokenTranslationProvider[] {
  if (!shouldUseLibreTranslate(env)) {
    return [];
  }

  return [
    new LibreTranslateTokenProvider({
      endpoint: env.LIBRETRANSLATE_ENDPOINT!,
      apiKey: env.LIBRETRANSLATE_API_KEY,
    }),
  ];
}

function shouldUseLibreTranslate(env: ApiEnvironment): boolean {
  return (
    env.WORDUNPACK_TRANSLATION_PROVIDER === "libretranslate" &&
    Boolean(env.LIBRETRANSLATE_ENDPOINT)
  );
}

function validateExplainBody(body: ExplainRequestBody):
  | {
      ok: true;
      input: string;
      source: LanguageCode;
      target: LanguageCode;
      timeoutMs: number;
    }
  | { ok: false; error: string } {
  if (typeof body.input !== "string" || !body.input.trim()) {
    return { ok: false, error: "input is required" };
  }

  if (typeof body.source !== "string") {
    return { ok: false, error: "source is required" };
  }

  if (typeof body.target !== "string") {
    return { ok: false, error: "target is required" };
  }

  const timeoutMs =
    typeof body.timeoutMs === "number" && Number.isFinite(body.timeoutMs)
      ? body.timeoutMs
      : 30_000;

  return {
    ok: true,
    input: body.input,
    source: body.source,
    target: body.target,
    timeoutMs,
  };
}

function respondWithError(context: Context, error: unknown) {
  if (error instanceof UnsupportedLanguagePairError) {
    return context.json({ error: error.message }, 400);
  }

  if (error instanceof ProviderError) {
    return context.json({ error: error.message, provider: error.provider }, 502);
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  return context.json({ error: message }, 500);
}
