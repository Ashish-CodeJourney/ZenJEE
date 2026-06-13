// =============================================================================
// localStorage abstraction — typed, versioned, SSR-safe.
// All reads are null-safe: if the key is missing or JSON is malformed we return
// the provided default value rather than throwing, because a corrupt local
// store must never crash the app.
// =============================================================================

import type { StorageKey, StorageSchema } from "@/types";

const STORAGE_VERSION = process.env.NEXT_PUBLIC_STORAGE_VERSION ?? "1";

/** Returns a versioned key to allow future migrations without stale data. */
const versionedKey = (key: StorageKey): string => `${key}:v${STORAGE_VERSION}`;

/**
 * Reads a typed value from localStorage.
 * Returns `defaultValue` when running server-side, key absent, or JSON invalid.
 */
export function storageGet<K extends StorageKey>(
  key: K,
  defaultValue: StorageSchema[K]
): StorageSchema[K] {
  if (typeof window === "undefined") return defaultValue;

  try {
    const raw = window.localStorage.getItem(versionedKey(key));
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as StorageSchema[K];
  } catch {
    return defaultValue;
  }
}

/**
 * Writes a typed value to localStorage.
 * Silently no-ops on SSR or when storage is full.
 */
export function storageSet<K extends StorageKey>(key: K, value: StorageSchema[K]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(versionedKey(key), JSON.stringify(value));
  } catch {
    // QuotaExceededError — gracefully ignore
  }
}

/**
 * Removes a key from localStorage.
 */
export function storageRemove(key: StorageKey): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(versionedKey(key));
}

/**
 * Clears all ZenJEE keys from localStorage (used for "reset account").
 */
export function storageClearAll(): void {
  if (typeof window === "undefined") return;

  Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i))
    .filter((k): k is string => k?.startsWith("zenjee:") ?? false)
    .forEach((k) => window.localStorage.removeItem(k));
}
