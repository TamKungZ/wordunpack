import { createApiApp } from "../packages/api/src/index.js";

const app = createApiApp({
  env: {
    WORDUNPACK_TRANSLATION_PROVIDER: process.env.WORDUNPACK_TRANSLATION_PROVIDER,
    LIBRETRANSLATE_ENDPOINT: process.env.LIBRETRANSLATE_ENDPOINT,
    LIBRETRANSLATE_API_KEY: process.env.LIBRETRANSLATE_API_KEY,
  },
});

const inputs = [
  "私はりんごを食べます。",
  "君のことが好きです。",
  "何をしているの？",
];

for (const input of inputs) {
  const response = await app.request("/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input,
      source: "ja",
      target: "th",
      includeNaturalTranslation: true,
      includeTokenTranslation: true,
      timeoutMs: 30_000,
    }),
  });

  console.log(JSON.stringify(await response.json(), null, 2));
}
