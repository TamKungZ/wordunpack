# @wordunpack/provider-libretranslate

LibreTranslate-compatible natural sentence translation provider.

No public endpoint or API key is hardcoded.

```ts
import { LibreTranslateProvider } from "@wordunpack/provider-libretranslate";

const provider = new LibreTranslateProvider({
  endpoint: process.env.LIBRETRANSLATE_ENDPOINT!,
  apiKey: process.env.LIBRETRANSLATE_API_KEY,
});
```
