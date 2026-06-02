export type LanguageCode = "en" | "ja" | "th" | (string & {});

export type TokenKind =
  | "word"
  | "particle"
  | "grammar"
  | "phrase"
  | "punctuation"
  | "unknown";

export interface TextSpan {
  start: number;
  end: number;
}

export interface TokenizedToken {
  surface: string;
  normalized?: string;
  reading?: string;
  romanization?: string;
  lemma?: string;
  baseForm?: string;
  partOfSpeech?: string;
  kind: TokenKind;
  span: TextSpan;
}

export interface ExplainedToken extends TokenizedToken {
  direct: string;
  role: string;
  note?: string;
  confidence?: number;
  sourceProvider?: string;
}

export interface SentenceExplanation {
  source: LanguageCode;
  target: LanguageCode;
  input: string;
  tokens: ExplainedToken[];
  literalTranslation: string;
  naturalTranslation?: string;
  providersUsed: string[];
  warnings: string[];
}

export interface ExplainSentenceOptions {
  source: LanguageCode;
  target: LanguageCode;
  translationCache?: TranslationCache;
  logger?: Logger;
}

export interface CreateExplainerOptions {
  tokenizers?: TokenizerProvider[];
  wordMeaningProviders?: WordMeaningProvider[];
  sentenceTranslationProviders?: SentenceTranslationProvider[];
  romanizerProviders?: RomanizerProvider[];
  languageModules?: LanguageModule[];
  translationCache?: TranslationCache;
  logger?: Logger;
}

export interface TokenizerContext {
  source: LanguageCode;
  input: string;
}

export interface WordMeaningContext {
  source: LanguageCode;
  target: LanguageCode;
  input: string;
  tokens: TokenizedToken[];
}

export interface SentenceTranslationContext {
  source: LanguageCode;
  target: LanguageCode;
  tokens: ExplainedToken[];
}

export interface RomanizerContext {
  source: LanguageCode;
  tokens: TokenizedToken[];
}

export interface ProviderSupport {
  source: LanguageCode;
  target?: LanguageCode;
}

export interface TokenizerProvider {
  name: string;
  supports(source: LanguageCode): boolean;
  tokenize(input: string, context: TokenizerContext): Promise<TokenizedToken[]>;
}

export interface WordMeaningProvider {
  name: string;
  supports(source: LanguageCode, target: LanguageCode): boolean;
  lookup(
    token: TokenizedToken,
    context: WordMeaningContext,
  ): Promise<Partial<ExplainedToken> | undefined>;
}

export interface SentenceTranslationProvider {
  name: string;
  supports(source: LanguageCode, target: LanguageCode): boolean;
  translate(
    input: string,
    context: SentenceTranslationContext,
  ): Promise<string | undefined>;
}

export interface RomanizerProvider {
  name: string;
  supports(source: LanguageCode): boolean;
  romanize(
    token: TokenizedToken,
    context: RomanizerContext,
  ): Promise<string | undefined>;
}

export interface LanguageModule {
  name: string;
  source: LanguageCode;
  tokenizers?: TokenizerProvider[];
  wordMeaningProviders?: WordMeaningProvider[];
  sentenceTranslationProviders?: SentenceTranslationProvider[];
  romanizerProviders?: RomanizerProvider[];
}

export interface TranslationCache {
  get(key: string): Promise<string | undefined> | string | undefined;
  set(key: string, value: string): Promise<void> | void;
}

export interface Logger {
  debug?(message: string, details?: unknown): void;
  warn?(message: string, details?: unknown): void;
  error?(message: string, details?: unknown): void;
}

export interface Explainer {
  explainSentence(
    input: string,
    options: ExplainSentenceOptions,
  ): Promise<SentenceExplanation>;
}
