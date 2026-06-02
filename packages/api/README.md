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
