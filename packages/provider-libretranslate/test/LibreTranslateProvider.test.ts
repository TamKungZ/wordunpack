import { describe, expect, it } from "vitest";

import { ProviderError } from "@wordunpack/core";
import {
  LibreTranslateProvider,
  LibreTranslateTokenProvider,
} from "../src/index.js";

describe("LibreTranslateProvider", () => {
  it("posts to a LibreTranslate-compatible endpoint", async () => {
    const requests: unknown[] = [];
    const provider = new LibreTranslateProvider({
      endpoint: "https://example.test/translate",
      apiKey: "secret",
      fetch: async (_url, init) => {
        requests.push(JSON.parse(String(init?.body)));
        return new Response(JSON.stringify({ translatedText: "ฉันกินแอปเปิล" }));
      },
    });

    const translated = await provider.translate("私はりんごを食べます。", {
      source: "ja",
      target: "th",
      tokens: [],
      timeoutMs: 30_000,
    });

    expect(translated).toBe("ฉันกินแอปเปิล");
    expect(requests[0]).toMatchObject({
      q: "私はりんごを食べます。",
      source: "ja",
      target: "th",
      api_key: "secret",
    });
  });

  it("throws ProviderError on failure", async () => {
    const provider = new LibreTranslateProvider({
      endpoint: "https://example.test/translate",
      fetch: async () => new Response("nope", { status: 500 }),
    });

    await expect(
      provider.translate("hello", {
        source: "en",
        target: "th",
        tokens: [],
        timeoutMs: 30_000,
      }),
    ).rejects.toBeInstanceOf(ProviderError);
  });

  it("translates a token using the same backend", async () => {
    const provider = new LibreTranslateTokenProvider({
      endpoint: "https://example.test/translate",
      fetch: async (_url, init) => {
        const body = JSON.parse(String(init?.body)) as { q: string };
        return new Response(JSON.stringify({ translatedText: `${body.q}-th` }));
      },
    });

    const gloss = await provider.translateToken(
      {
        surface: "食べ",
        baseForm: "食べる",
        kind: "word",
        span: { start: 4, end: 6 },
      },
      {
        source: "ja",
        target: "th",
        input: "私はりんごを食べます。",
        tokens: [],
        timeoutMs: 30_000,
      },
    );

    expect(gloss?.direct).toBe("食べる-th");
  });
});
