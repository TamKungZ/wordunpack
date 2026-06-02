import { buildLiteralTranslation } from "./buildLiteralTranslation.js";
import { explainToken } from "./explainToken.js";
import { assertSupportedLanguagePair } from "./languagePair.js";
import {
  selectOptionalTokenTranslationProvider,
  selectOptionalTranslationProvider,
  selectOptionalWordMeaningProvider,
  selectTokenizer,
} from "./providerSelection.js";
import {
  pushOnce,
  translateNaturally,
  translateTokenSafely,
} from "./translateWithProviders.js";
import type {
  CreateExplainerOptions,
  Explainer,
  ExplainSentenceOptions,
  SentenceExplanation,
} from "./types.js";

const defaultTimeoutMs = 30_000;

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
  const tokenTranslationProviders = [
    ...(options.tokenTranslationProviders ?? []),
    ...(options.languageModules ?? []).flatMap(
      (module) => module.tokenTranslationProviders ?? [],
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
      const timeoutMs = explainOptions.timeoutMs ?? defaultTimeoutMs;
      const includeTokenTranslation =
        explainOptions.includeTokenTranslation ?? true;
      const includeNaturalTranslation =
        explainOptions.includeNaturalTranslation ?? true;
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
      const tokenTranslationProvider = selectOptionalTokenTranslationProvider(
        tokenTranslationProviders,
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
          const staticGloss = wordMeaningProvider
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

          if (!staticGloss && !tokenTranslationProvider) {
            warnings.push(`No gloss for token "${token.surface}".`);
          }

          const translatedGloss = includeTokenTranslation
            ? await translateTokenSafely({
                cache: explainOptions.translationCache ?? options.translationCache,
                input: normalizedInput,
                provider: tokenTranslationProvider,
                source,
                target,
                timeoutMs,
                token,
                tokens: tokenizedTokens,
                warnings,
                providersUsed,
              })
            : undefined;

          if (
            includeTokenTranslation &&
            !tokenTranslationProvider &&
            token.kind !== "punctuation"
          ) {
            pushOnce(warnings, "No translation provider configured");
          }

          return explainToken({
            token,
            staticGloss,
            translatedGloss,
            staticProviderName: wordMeaningProvider?.name,
            tokenProviderName: tokenTranslationProvider?.name,
          });
        }),
      );

      const naturalTranslation = includeNaturalTranslation
        ? await translateNaturally({
            cache: explainOptions.translationCache ?? options.translationCache,
            input: normalizedInput,
            provider: sentenceTranslationProvider,
            source,
            target,
            timeoutMs,
            tokens,
            providersUsed,
            warnings,
          })
        : undefined;

      if (includeNaturalTranslation && !sentenceTranslationProvider) {
        pushOnce(warnings, "No translation provider configured");
      }

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
