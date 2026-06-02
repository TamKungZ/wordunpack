import { describe, expect, it } from "vitest";

import { JapaneseThaiSeedGlossProvider } from "../src/index.js";

describe("JapaneseThaiSeedGlossProvider", () => {
  it("explains particles as grammar roles", async () => {
    const provider = new JapaneseThaiSeedGlossProvider();
    const gloss = await provider.lookup(
      {
        surface: "を",
        kind: "particle",
        span: { start: 1, end: 2 },
      },
      {
        source: "ja",
        target: "th",
        input: "何を",
        tokens: [],
      },
    );

    expect(gloss?.direct).toBe("ชี้กรรม");
    expect(gloss?.role).toContain("particle");
  });
});
