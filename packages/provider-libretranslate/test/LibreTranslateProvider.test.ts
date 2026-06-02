import { describe, expect, it } from "vitest";

import { ProviderError } from "@wordunpack/core";
import { LibreTranslateProvider } from "../src/index.js";

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
      provider.translate("hello", { source: "en", target: "th", tokens: [] }),
    ).rejects.toBeInstanceOf(ProviderError);
  });
});
