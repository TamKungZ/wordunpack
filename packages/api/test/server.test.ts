import { describe, expect, it } from "vitest";

import type { TokenizerProvider } from "@wordunpack/core";
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
});
