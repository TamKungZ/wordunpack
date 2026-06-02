import { describe, expect, it } from "vitest";

import { createApiApp } from "../src/index.js";

describe("Japanese explanation integration", () => {
  it.each([
    {
      input: "私はりんごを食べます。",
      expectedSurfaces: ["私", "は", "りんご", "を", "食べ", "ます", "。"],
    },
    {
      input: "君のことが好きです。",
      expectedSurfaces: ["君", "の", "こと", "が", "好き", "です", "。"],
    },
    {
      input: "何をしているの？",
      expectedSurfaces: ["何", "を", "し", "て", "いる", "の", "？"],
    },
  ])("explains $input without fake natural translation", async (caseData) => {
    const app = createApiApp();
    const response = await app.request("/explain", {
      method: "POST",
      body: JSON.stringify({
        input: caseData.input,
        source: "ja",
        target: "th",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.naturalTranslation).toBeUndefined();
    expect(json.tokens.map((token: { surface: string }) => token.surface)).toEqual(
      caseData.expectedSurfaces,
    );
    expect(json.providersUsed).toContain("tokenizer-ja-kuromoji");
    expect(json.providersUsed).toContain("gloss-ja-th-seed");
  });
});
