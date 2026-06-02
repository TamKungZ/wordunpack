# @wordunpack/api

Small Hono API package for server-side WordUnpack usage.

Routes:

- `POST /explain`
- `POST /translate`
- `GET /languages`

Provider API keys are read from environment variables and are never returned to
clients.

```ts
import { createApiApp } from "@wordunpack/api";

const app = createApiApp({
  env: {
    LIBRETRANSLATE_ENDPOINT: process.env.LIBRETRANSLATE_ENDPOINT,
    LIBRETRANSLATE_API_KEY: process.env.LIBRETRANSLATE_API_KEY,
  },
});
```

## LibreTranslate Configuration

```sh
set WORDUNPACK_TRANSLATION_PROVIDER=libretranslate
set LIBRETRANSLATE_ENDPOINT=http://localhost:5000/translate
set LIBRETRANSLATE_API_KEY=
```

`POST /explain`:

```json
{
  "input": "私はりんごを食べます。",
  "source": "ja",
  "target": "th",
  "includeNaturalTranslation": true,
  "includeTokenTranslation": true,
  "timeoutMs": 30000
}
```

If no provider is configured, the API still tokenizes and returns warnings
instead of pretending to translate.
