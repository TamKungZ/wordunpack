# @wordunpack/core

Core provider pipeline, types, errors, and language-pair utilities for
WordUnpack.

This package intentionally contains no concrete tokenizer, translation API, or
language-specific dictionary implementation.

## Install

```sh
npm install @wordunpack/core
```

## Usage

```ts
import { createExplainer } from "@wordunpack/core";
import { JapaneseThaiSeedGlossProvider } from "@wordunpack/gloss-ja-th";
import { KuromojiTokenizerProvider } from "@wordunpack/tokenizer-ja-kuromoji";

const explainer = createExplainer({
  tokenizers: [new KuromojiTokenizerProvider()],
  wordMeaningProviders: [new JapaneseThaiSeedGlossProvider()],
});

const result = await explainer.explainSentence("私はりんごを食べます。", {
  source: "ja",
  target: "th",
});
```

## Providers

WordUnpack core exposes three provider interfaces:

- `TokenizerProvider`
- `WordMeaningProvider`
- `SentenceTranslationProvider`

Natural sentence translation is not faked. It is `undefined` unless a real
`SentenceTranslationProvider` is configured.

## Package Direction

The engine can stay open source while products and curated datasets remain
separate.

```text
packages/
  core/
  ja/
  th/
  react/
apps/
  web/
```

This package currently starts as `@wordunpack/core`; language-specific packages
can be split out as the dictionaries and grammar rules grow.

## License

Apache-2.0
