import { MissingProviderError } from "./errors.js";
import type {
  SentenceTranslationProvider,
  TokenTranslationProvider,
  TokenizerProvider,
  WordMeaningProvider,
} from "./types.js";

export function selectTokenizer(
  providers: TokenizerProvider[],
  source: string,
): TokenizerProvider {
  const provider = providers.find((candidate) => candidate.supports(source));
  if (!provider) {
    throw new MissingProviderError("tokenizer", `source "${source}"`);
  }

  return provider;
}

export function selectOptionalWordMeaningProvider(
  providers: WordMeaningProvider[],
  source: string,
  target: string,
): WordMeaningProvider | undefined {
  return providers.find((provider) => provider.supports(source, target));
}

export function selectOptionalTranslationProvider(
  providers: SentenceTranslationProvider[],
  source: string,
  target: string,
): SentenceTranslationProvider | undefined {
  return providers.find((provider) => provider.supports(source, target));
}

export function selectOptionalTokenTranslationProvider(
  providers: TokenTranslationProvider[],
  source: string,
  target: string,
): TokenTranslationProvider | undefined {
  return providers.find((provider) => provider.supports(source, target));
}
