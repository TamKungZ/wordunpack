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

## License

Apache-2.0
