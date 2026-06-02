import { describe, expect, it } from "vitest";

import type {
  SentenceTranslationProvider,
  TokenTranslationProvider,
  TokenizerProvider,
} from "@wordunpack/core";
import { createApiApp } from "../src/index.js";

const testTokenizer: TokenizerProvider = {
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

describe("@wordunpack/api", () => {
  it("returns supported language pairs", async () => {
    const app = createApiApp({ tokenizers: [testTokenizer] });
    const response = await app.request("/languages");
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.pairs).toContainEqual({ source: "en", target: "th" });
  });

  it("/explain does not expose provider API keys", async () => {
    const app = createApiApp({
      env: {
        WORDUNPACK_TRANSLATION_PROVIDER: "libretranslate",
        LIBRETRANSLATE_ENDPOINT: "https://example.test/translate",
        LIBRETRANSLATE_API_KEY: "super-secret",
      },
      tokenizers: [testTokenizer],
    });

    const response = await app.request("/explain", {
      method: "POST",
      body: JSON.stringify({
        input: "hello",
        source: "en",
        target: "th",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).not.toContain("super-secret");
    expect(text).not.toContain("LIBRETRANSLATE_API_KEY");
  });

  it("/explain returns token and natural translations from configured providers", async () => {
    const tokenProvider: TokenTranslationProvider = {
      name: "mock-token-provider",
      supports: (source, target) => source === "en" && target === "th",
      async translateToken(token) {
        return {
          direct: `${token.surface}-th`,
          role: "translated token",
          sourceProvider: "mock-token-provider",
        };
      },
    };
    const sentenceProvider: SentenceTranslationProvider = {
      name: "mock-sentence-provider",
      supports: (source, target) => source === "en" && target === "th",
      async translate() {
        return "สวัสดีชาวโลก";
      },
    };
    const app = createApiApp({
      tokenizers: [testTokenizer],
      tokenTranslationProviders: [tokenProvider],
      sentenceTranslationProviders: [sentenceProvider],
    });

    const response = await app.request("/explain", {
      method: "POST",
      body: JSON.stringify({
        input: "hello world",
        source: "en",
        target: "th",
        includeNaturalTranslation: true,
        includeTokenTranslation: true,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.tokens[0].direct).toBe("hello-th");
    expect(json.naturalTranslation).toBe("สวัสดีชาวโลก");
    expect(json.providersUsed).toContain("mock-token-provider");
    expect(json.providersUsed).toContain("mock-sentence-provider");
  });

  it("/explain returns partial output when translation times out", async () => {
    const slowProvider: SentenceTranslationProvider = {
      name: "slow-provider",
      supports: () => true,
      async translate() {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return "too late";
      },
    };
    const app = createApiApp({
      tokenizers: [testTokenizer],
      sentenceTranslationProviders: [slowProvider],
    });

    const response = await app.request("/explain", {
      method: "POST",
      body: JSON.stringify({
        input: "hello",
        source: "en",
        target: "th",
        includeNaturalTranslation: true,
        timeoutMs: 1,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.tokens[0].surface).toBe("hello");
    expect(json.naturalTranslation).toBeUndefined();
    expect(json.warnings).toContain("Translation provider timed out");
  });

  it("/explain warns when no translation provider is configured", async () => {
    const app = createApiApp({ tokenizers: [testTokenizer] });

    const response = await app.request("/explain", {
      method: "POST",
      body: JSON.stringify({
        input: "hello",
        source: "en",
        target: "th",
        includeNaturalTranslation: true,
        includeTokenTranslation: true,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.tokens[0].direct).toBe("hello");
    expect(json.warnings).toContain("No translation provider configured");
  });
});
