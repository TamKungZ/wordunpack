import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@wordunpack/api": resolve(root, "packages/api/src/index.ts"),
      "@wordunpack/core": resolve(root, "packages/core/src/index.ts"),
      "@wordunpack/gloss-en-th": resolve(root, "packages/gloss-en-th/src/index.ts"),
      "@wordunpack/gloss-ja-th": resolve(root, "packages/gloss-ja-th/src/index.ts"),
      "@wordunpack/gloss-th-en": resolve(root, "packages/gloss-th-en/src/index.ts"),
      "@wordunpack/provider-deepl": resolve(root, "packages/provider-deepl/src/index.ts"),
      "@wordunpack/provider-google": resolve(root, "packages/provider-google/src/index.ts"),
      "@wordunpack/provider-libretranslate": resolve(
        root,
        "packages/provider-libretranslate/src/index.ts",
      ),
      "@wordunpack/provider-transformers": resolve(
        root,
        "packages/provider-transformers/src/index.ts",
      ),
      "@wordunpack/react": resolve(root, "packages/react/src/index.ts"),
      "@wordunpack/tokenizer-en": resolve(root, "packages/tokenizer-en/src/index.ts"),
      "@wordunpack/tokenizer-ja-kuromoji": resolve(
        root,
        "packages/tokenizer-ja-kuromoji/src/index.ts",
      ),
      "@wordunpack/tokenizer-th": resolve(root, "packages/tokenizer-th/src/index.ts"),
    },
  },
  test: {
    include: ["packages/*/test/**/*.test.ts"],
  },
});
