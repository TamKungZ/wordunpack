import { describe, expect, it } from "vitest";

import {
  createExplainer,
  explainSentence,
  UnsupportedLanguagePairError,
  type SentenceTranslationProvider,
  type TokenizerProvider,
  type WordMeaningProvider,
} from "../src/index.js";

const tokenizer: TokenizerProvider = {
  name: "test-tokenizer",
  supports: (source) => source === "en",
  async tokenize(input) {
    return input.split(" ").map((surface, index) => ({
      surface,
      kind: "word",
      span: { start: index, end: index + surface.length },
    }));
  },
};

const gloss: WordMeaningProvider = {
  name: "test-gloss",
  supports: (source, target) => source === "en" && target === "th",
  async lookup(token) {
    return {
      direct: token.surface === "hello" ? "สวัสดี" : token.surface,
      role: "word",
    };
  },
};

describe("@wordunpack/core", () => {
  it("selects providers and does not add naturalTranslation without a provider", async () => {
    const explainer = createExplainer({
      tokenizers: [tokenizer],
      wordMeaningProviders: [gloss],
    });

    const result = await explainer.explainSentence("hello world", {
      source: "en",
      target: "th",
    });

    expect(result.literalTranslation).toBe("สวัสดี / world");
    expect(result.naturalTranslation).toBeUndefined();
    expect(result.providersUsed).toEqual(["test-tokenizer", "test-gloss"]);
  });

  it("uses an injected sentence translation provider", async () => {
    const translator: SentenceTranslationProvider = {
      name: "fake-real-provider",
      supports: (source, target) => source === "en" && target === "th",
      async translate() {
        return "สวัสดีชาวโลก";
      },
    };

    const result = await explainSentence("hello world", {
      source: "en",
      target: "th",
      tokenizers: [tokenizer],
      wordMeaningProviders: [gloss],
      sentenceTranslationProviders: [translator],
    });

    expect(result.naturalTranslation).toBe("สวัสดีชาวโลก");
    expect(result.providersUsed).toContain("fake-real-provider");
  });

  it("validates language pairs", async () => {
    const explainer = createExplainer({ tokenizers: [tokenizer] });

    await expect(
      explainer.explainSentence("hello", { source: "en", target: "fr" }),
    ).rejects.toBeInstanceOf(UnsupportedLanguagePairError);
  });
});
