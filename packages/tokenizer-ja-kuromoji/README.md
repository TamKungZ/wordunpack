# @wordunpack/tokenizer-ja-kuromoji

Japanese tokenizer provider for WordUnpack using `kuromoji`.

```ts
import { createExplainer } from "@wordunpack/core";
import { KuromojiTokenizerProvider } from "@wordunpack/tokenizer-ja-kuromoji";

const explainer = createExplainer({
  tokenizers: [new KuromojiTokenizerProvider()],
});
```
