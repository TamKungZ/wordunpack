# WordUnpack

WordUnpack is a prototype TypeScript monorepo for learning-oriented translation
breakdown.

It is not a normal translator. The goal is to help learners understand how a
sentence works by showing tokens, readings, rough glosses, grammar roles,
literal word-by-word meaning, and optional natural translations from configured
providers.

## Prototype Status

This project is an early prototype. APIs, package boundaries, provider behavior,
and data formats may change while the architecture is being explored.

Do not treat the current output as production-grade translation quality. Static
gloss packages are seed/fallback learning aids only, not translation engines.

## Packages

Implemented first-pass packages:

- `@wordunpack/core`: provider contracts, pipeline, errors, language-pair utilities
- `@wordunpack/tokenizer-ja-kuromoji`: Japanese tokenizer using kuromoji
- `@wordunpack/gloss-ja-th`: seed Japanese-to-Thai grammar/particle gloss provider
- `@wordunpack/provider-libretranslate`: LibreTranslate-compatible provider
- `@wordunpack/api`: server-side API wrapper

Prototype boundaries with TODO exports:

- `@wordunpack/tokenizer-en`
- `@wordunpack/tokenizer-th`
- `@wordunpack/provider-deepl`
- `@wordunpack/provider-google`
- `@wordunpack/provider-transformers`
- `@wordunpack/gloss-en-th`
- `@wordunpack/gloss-th-en`
- `@wordunpack/react`

## Development

```sh
npm install
npm run typecheck
npm test
npm run build
```

## End-to-End Prototype Usage

WordUnpack can tokenize without a translation provider. To get provider-backed
token direct meanings and natural sentence translations, configure a real
translation backend.

Example with a local LibreTranslate-compatible server:

```sh
set WORDUNPACK_TRANSLATION_PROVIDER=libretranslate
set LIBRETRANSLATE_ENDPOINT=http://localhost:5000/translate
set LIBRETRANSLATE_API_KEY=
```

Then call the API package:

```ts
import { createApiApp } from "@wordunpack/api";

const app = createApiApp();

const response = await app.request("/explain", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    input: "私はりんごを食べます。",
    source: "ja",
    target: "th",
    includeNaturalTranslation: true,
    includeTokenTranslation: true,
    timeoutMs: 30000
  })
});

console.log(await response.json());
```

Expected response shape:

```json
{
  "source": "ja",
  "target": "th",
  "input": "私はりんごを食べます。",
  "tokens": [
    {
      "surface": "私",
      "kind": "word",
      "direct": "ฉัน",
      "role": "名詞/代名詞/一般",
      "sourceProvider": "provider-libretranslate"
    }
  ],
  "literalTranslation": "ฉัน / หัวข้อ / แอปเปิล / ชี้กรรม / กิน / ...",
  "naturalTranslation": "ฉันกินแอปเปิล",
  "providersUsed": ["tokenizer-ja-kuromoji", "gloss-ja-th-seed", "provider-libretranslate"],
  "warnings": []
}
```

If provider config is missing, `/explain` still returns tokenized output with
fallback direct values and includes:

```json
{ "warnings": ["No translation provider configured"] }
```

Manual example:

```sh
npm run example:ja-th
```

## License

Apache-2.0
