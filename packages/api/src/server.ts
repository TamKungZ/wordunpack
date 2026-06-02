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
} from "@wordunpack/core";
import { JapaneseThaiSeedGlossProvider } from "@wordunpack/gloss-ja-th";
import { LibreTranslateProvider } from "@wordunpack/provider-libretranslate";
import { KuromojiTokenizerProvider } from "@wordunpack/tokenizer-ja-kuromoji";

import { MemoryTranslationCache } from "./memoryTranslationCache.js";

export interface ApiEnvironment {
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
}

export function createApiApp(options: CreateApiAppOptions = {}) {
  const env = options.env ?? process.env;
  const translationProviders = [
    ...(options.sentenceTranslationProviders ?? []),
    ...createEnvironmentTranslationProviders(env),
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
        ? translationExplainer
        : explainer;
      const result = await selectedExplainer.explainSentence(validation.input, {
        source: validation.source,
        target: validation.target,
      });

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
  if (!env.LIBRETRANSLATE_ENDPOINT) {
    return [];
  }

  return [
    new LibreTranslateProvider({
      endpoint: env.LIBRETRANSLATE_ENDPOINT,
      apiKey: env.LIBRETRANSLATE_API_KEY,
    }),
  ];
}

function validateExplainBody(body: ExplainRequestBody):
  | {
      ok: true;
      input: string;
      source: LanguageCode;
      target: LanguageCode;
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

  return {
    ok: true,
    input: body.input,
    source: body.source,
    target: body.target,
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
