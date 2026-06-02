import {
  ProviderError,
  type LanguageCode,
  type SentenceTranslationContext,
  type SentenceTranslationProvider,
  type TokenGloss,
  type TokenTranslationContext,
  type TokenTranslationProvider,
  type TokenizedToken,
} from "@wordunpack/core";

export interface LibreTranslateProviderOptions {
  endpoint: string;
  apiKey?: string;
  source?: LanguageCode;
  target?: LanguageCode;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

export class LibreTranslateProvider implements SentenceTranslationProvider {
  readonly name = "provider-libretranslate";

  private readonly endpoint: string;
  private readonly apiKey?: string;
  private readonly source?: LanguageCode;
  private readonly target?: LanguageCode;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: LibreTranslateProviderOptions) {
    this.endpoint = options.endpoint;
    this.apiKey = options.apiKey;
    this.source = options.source;
    this.target = options.target;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.fetchImpl = options.fetch ?? fetch;
  }

  supports(source: LanguageCode, target: LanguageCode): boolean {
    return (!this.source || this.source === source) && (!this.target || this.target === target);
  }

  async translate(
    input: string,
    context: SentenceTranslationContext,
  ): Promise<string | undefined> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          q: input,
          source: context.source,
          target: context.target,
          format: "text",
          api_key: this.apiKey,
        }),
      });

      if (!response.ok) {
        throw new ProviderError("LibreTranslate request failed.", {
          provider: this.name,
          status: response.status,
        });
      }

      const payload = (await response.json()) as { translatedText?: unknown };
      return typeof payload.translatedText === "string"
        ? payload.translatedText
        : undefined;
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }

      throw new ProviderError("LibreTranslate request failed.", {
        provider: this.name,
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class LibreTranslateTokenProvider implements TokenTranslationProvider {
  readonly name = "provider-libretranslate";

  private readonly sentenceProvider: LibreTranslateProvider;

  constructor(options: LibreTranslateProviderOptions) {
    this.sentenceProvider = new LibreTranslateProvider(options);
  }

  supports(source: LanguageCode, target: LanguageCode): boolean {
    return this.sentenceProvider.supports(source, target);
  }

  async translateToken(
    token: TokenizedToken,
    context: TokenTranslationContext,
  ): Promise<TokenGloss | undefined> {
    const text = chooseTokenText(token);
    if (!text) {
      return undefined;
    }

    const direct = await this.sentenceProvider.translate(text, {
      source: context.source,
      target: context.target,
      tokens: [],
      timeoutMs: context.timeoutMs,
    });

    if (!direct) {
      return undefined;
    }

    return {
      direct,
      role: token.partOfSpeech,
      confidence: 0.7,
      sourceProvider: this.name,
    };
  }
}

function chooseTokenText(token: TokenizedToken): string | undefined {
  if (token.kind === "punctuation") {
    return undefined;
  }

  return token.baseForm ?? token.lemma ?? token.normalized ?? token.surface;
}
