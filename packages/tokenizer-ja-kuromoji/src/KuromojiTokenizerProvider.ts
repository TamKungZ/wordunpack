import { dirname, join } from "node:path";
import { createRequire } from "node:module";

import type {
  LanguageCode,
  TokenizedToken,
  TokenizerContext,
  TokenizerProvider,
} from "@wordunpack/core";
import type { IpadicFeatures, Tokenizer } from "kuromoji";

const requireFromModule = createRequire(import.meta.url);
const kuromojiRuntime = requireFromModule("kuromoji") as typeof import("kuromoji");

export interface KuromojiTokenizerProviderOptions {
  dicPath?: string;
}

export class KuromojiTokenizerProvider implements TokenizerProvider {
  readonly name = "tokenizer-ja-kuromoji";

  private readonly dicPath: string;
  private tokenizerPromise?: Promise<Tokenizer<IpadicFeatures>>;

  constructor(options: KuromojiTokenizerProviderOptions = {}) {
    this.dicPath = options.dicPath ?? resolveKuromojiDictionaryPath();
  }

  supports(source: LanguageCode): boolean {
    return source === "ja";
  }

  async tokenize(
    input: string,
    _context: TokenizerContext,
  ): Promise<TokenizedToken[]> {
    const tokenizer = await this.getTokenizer();

    return tokenizer.tokenize(input).map((token) => {
      const start = Math.max(0, token.word_position - 1);

      return {
        surface: token.surface_form,
        normalized: token.surface_form,
        reading: normalizeKuromojiValue(token.reading),
        lemma: normalizeKuromojiValue(token.basic_form),
        baseForm: normalizeKuromojiValue(token.basic_form),
        partOfSpeech: buildPartOfSpeech(token),
        kind: classifyJapaneseToken(token),
        span: {
          start,
          end: start + token.surface_form.length,
        },
      };
    });
  }

  private getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
    this.tokenizerPromise ??= new Promise((resolve, reject) => {
      kuromojiRuntime.builder({ dicPath: this.dicPath }).build((error, tokenizer) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(tokenizer);
      });
    });

    return this.tokenizerPromise;
  }
}

function resolveKuromojiDictionaryPath(): string {
  return join(dirname(requireFromModule.resolve("kuromoji/package.json")), "dict");
}

function normalizeKuromojiValue(value: string | undefined): string | undefined {
  if (!value || value === "*") {
    return undefined;
  }

  return value;
}

function buildPartOfSpeech(token: IpadicFeatures): string | undefined {
  const value = [
    token.pos,
    token.pos_detail_1,
    token.pos_detail_2,
    token.pos_detail_3,
  ]
    .filter((part) => part && part !== "*")
    .join("/");

  return value || undefined;
}

function classifyJapaneseToken(token: IpadicFeatures) {
  if (/^[\p{P}\p{S}]+$/u.test(token.surface_form)) {
    return "punctuation" as const;
  }

  if (token.pos === "助詞") {
    return "particle" as const;
  }

  if (
    token.pos === "助動詞" ||
    token.pos_detail_1 === "接尾" ||
    token.pos_detail_1 === "非自立"
  ) {
    return "grammar" as const;
  }

  if (token.word_type === "UNKNOWN") {
    return "unknown" as const;
  }

  return "word" as const;
}
