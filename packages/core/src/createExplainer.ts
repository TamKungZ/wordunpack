import { buildLiteralTranslation } from "./buildLiteralTranslation.js";
import {
  MissingProviderError,
} from "./errors.js";
import { assertSupportedLanguagePair, getLanguagePairKey } from "./languagePair.js";
import type {
  CreateExplainerOptions,
  ExplainedToken,
  Explainer,
  ExplainSentenceOptions,
  SentenceExplanation,
  SentenceTranslationProvider,
  TokenizedToken,
  TokenizerProvider,
  WordMeaningProvider,
} from "./types.js";

export function createExplainer(options: CreateExplainerOptions = {}): Explainer {
  const tokenizers = [
    ...(options.tokenizers ?? []),
    ...(options.languageModules ?? []).flatMap((module) => module.tokenizers ?? []),
  ];
  const wordMeaningProviders = [
    ...(options.wordMeaningProviders ?? []),
    ...(options.languageModules ?? []).flatMap(
      (module) => module.wordMeaningProviders ?? [],
    ),
  ];
  const sentenceTranslationProviders = [
    ...(options.sentenceTranslationProviders ?? []),
    ...(options.languageModules ?? []).flatMap(
      (module) => module.sentenceTranslationProviders ?? [],
    ),
  ];

  return {
    async explainSentence(
      input: string,
      explainOptions: ExplainSentenceOptions,
    ): Promise<SentenceExplanation> {
      const source = explainOptions.source;
      const target = explainOptions.target;
      assertSupportedLanguagePair(source, target);

      const normalizedInput = input.trim();
      const tokenizer = selectTokenizer(tokenizers, source);
      const wordMeaningProvider = selectOptionalWordMeaningProvider(
        wordMeaningProviders,
        source,
        target,
      );
      const sentenceTranslationProvider = selectOptionalTranslationProvider(
        sentenceTranslationProviders,
        source,
        target,
      );

      const warnings: string[] = [];
      const providersUsed = new Set<string>([tokenizer.name]);
      const tokenizedTokens = await tokenizer.tokenize(normalizedInput, {
        source,
        input: normalizedInput,
      });

      const tokens = await Promise.all(
        tokenizedTokens.map(async (token) => {
          const gloss = wordMeaningProvider
            ? await wordMeaningProvider.lookup(token, {
                source,
                target,
                input: normalizedInput,
                tokens: tokenizedTokens,
              })
            : undefined;

          if (wordMeaningProvider) {
            providersUsed.add(wordMeaningProvider.name);
          }

          if (!gloss) {
            warnings.push(`No gloss for token "${token.surface}".`);
          }

          return explainToken(token, gloss, wordMeaningProvider?.name);
        }),
      );

      const naturalTranslation = await translateNaturally({
        cache: explainOptions.translationCache ?? options.translationCache,
        input: normalizedInput,
        provider: sentenceTranslationProvider,
        source,
        target,
        tokens,
        providersUsed,
      });

      return {
        source,
        target,
        input: normalizedInput,
        tokens,
        literalTranslation: buildLiteralTranslation(tokens),
        naturalTranslation,
        providersUsed: [...providersUsed],
        warnings,
      };
    },
  };
}

export async function explainSentence(
  input: string,
  options: ExplainSentenceOptions & CreateExplainerOptions,
): Promise<SentenceExplanation> {
  return createExplainer(options).explainSentence(input, options);
}

function selectTokenizer(
  providers: TokenizerProvider[],
  source: string,
): TokenizerProvider {
  const provider = providers.find((candidate) => candidate.supports(source));
  if (!provider) {
    throw new MissingProviderError("tokenizer", `source "${source}"`);
  }

  return provider;
}

function selectOptionalWordMeaningProvider(
  providers: WordMeaningProvider[],
  source: string,
  target: string,
): WordMeaningProvider | undefined {
  return providers.find((provider) => provider.supports(source, target));
}

function selectOptionalTranslationProvider(
  providers: SentenceTranslationProvider[],
  source: string,
  target: string,
): SentenceTranslationProvider | undefined {
  return providers.find((provider) => provider.supports(source, target));
}

function explainToken(
  token: TokenizedToken,
  gloss: Partial<ExplainedToken> | undefined,
  providerName: string | undefined,
): ExplainedToken {
  return {
    ...token,
    direct: gloss?.direct ?? token.surface,
    role: gloss?.role ?? fallbackRole(token),
    note: gloss?.note,
    confidence: gloss?.confidence,
    sourceProvider: gloss ? gloss.sourceProvider ?? providerName : undefined,
  };
}

function fallbackRole(token: TokenizedToken): string {
  if (token.kind === "punctuation") {
    return "punctuation";
  }

  return token.partOfSpeech ?? "unknown";
}

async function translateNaturally(args: {
  cache: CreateExplainerOptions["translationCache"];
  input: string;
  provider: SentenceTranslationProvider | undefined;
  source: string;
  target: string;
  tokens: ExplainedToken[];
  providersUsed: Set<string>;
}): Promise<string | undefined> {
  if (!args.provider) {
    return undefined;
  }

  const cacheKey = getLanguagePairKey(args.source, args.target) + ":" + args.input;
  const cached = await args.cache?.get(cacheKey);
  if (cached) {
    return cached;
  }

  const translated = await args.provider.translate(args.input, {
    source: args.source,
    target: args.target,
    tokens: args.tokens,
  });

  if (translated) {
    args.providersUsed.add(args.provider.name);
    await args.cache?.set(cacheKey, translated);
  }

  return translated;
}
