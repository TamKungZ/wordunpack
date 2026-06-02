import { describe, expect, it } from "vitest";

import { KuromojiTokenizerProvider } from "../src/index.js";

describe("KuromojiTokenizerProvider", () => {
  it("tokenizes Japanese and preserves token shape", async () => {
    const provider = new KuromojiTokenizerProvider();
    const tokens = await provider.tokenize("私はりんごを食べます。", {
      source: "ja",
      input: "私はりんごを食べます。",
    });

    expect(tokens.map((token) => token.surface)).toEqual([
      "私",
      "は",
      "りんご",
      "を",
      "食べ",
      "ます",
      "。",
    ]);
    expect(tokens[1]).toMatchObject({ kind: "particle", span: { start: 1, end: 2 } });
    expect(tokens[4].baseForm).toBe("食べる");
  });
});
