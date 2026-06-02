import type { TranslationCache } from "@wordunpack/core";

export interface MemoryTranslationCacheOptions {
  ttlMs?: number;
}

export class MemoryTranslationCache implements TranslationCache {
  private readonly values = new Map<string, { value: string; expiresAt: number }>();
  private readonly ttlMs: number;

  constructor(options: MemoryTranslationCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? 60 * 60 * 1000;
  }

  get(key: string): string | undefined {
    const entry = this.values.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt < Date.now()) {
      this.values.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: string): void {
    this.values.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }
}
