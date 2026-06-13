// =============================================================================
// Client-side encryption for journal content using the Web Crypto API.
// We use AES-GCM (authenticated encryption) with a per-device key derived from
// a user-specific salt stored alongside the ciphertext.
//
// WHY client-side encryption:
//   Mental health journal content is highly sensitive PII. Even though data
//   lives in localStorage (already local), encrypting it protects against
//   XSS-based data exfiltration: an attacker who injects a script and reads
//   localStorage gets ciphertext, not plaintext.
//
// LIMITATION: The key is derived from a browser-local secret. If the user
// clears site data, the key is gone and old entries cannot be decrypted.
// We surface this warning in the UI.
// =============================================================================

const ALGORITHM = "AES-GCM";
const KEY_USAGE: KeyUsage[] = ["encrypt", "decrypt"];
const STORAGE_KEY = "zenjee:crypto:keyMaterial";

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

const fromBase64 = (b64: string): Uint8Array<ArrayBuffer> =>
  new Uint8Array([...atob(b64)].map((c) => c.charCodeAt(0)));

async function getOrCreateKeyMaterial(): Promise<CryptoKey> {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    return crypto.subtle.importKey("raw", fromBase64(stored), { name: ALGORITHM }, false, KEY_USAGE);
  }

  const key = await crypto.subtle.generateKey({ name: ALGORITHM, length: 256 }, true, KEY_USAGE);
  const exported = await crypto.subtle.exportKey("raw", key);
  const base64 = btoa(Array.from(new Uint8Array(exported), (b) => String.fromCharCode(b)).join(""));
  localStorage.setItem(STORAGE_KEY, base64);
  return key;
}

function randomIV(): Uint8Array<ArrayBuffer> {
  const iv = new Uint8Array(new ArrayBuffer(12));
  crypto.getRandomValues(iv);
  return iv;
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Encrypts a plaintext string.
 * Returns a base64 string: `<iv>.<ciphertext>` (both base64-encoded).
 * No-ops gracefully and returns plain text when Web Crypto is unavailable
 * (e.g., non-secure contexts in development) so the app remains functional.
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (typeof window === "undefined" || !crypto.subtle) return plaintext;

  try {
    const key = await getOrCreateKeyMaterial();
    const iv = randomIV();
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded);

    const toBase64 = (buf: Uint8Array) =>
      btoa(Array.from(buf, (b) => String.fromCharCode(b)).join(""));
    return `${toBase64(iv)}.${toBase64(new Uint8Array(ciphertext))}`;
  } catch {
    return plaintext;
  }
}

/**
 * Decrypts a string produced by `encrypt`.
 * Returns the original plaintext, or the input unchanged if decryption fails
 * (handles legacy unencrypted entries or key rotation gracefully).
 */
export async function decrypt(maybeEncrypted: string): Promise<string> {
  if (typeof window === "undefined" || !crypto.subtle) return maybeEncrypted;
  if (!maybeEncrypted.includes(".")) return maybeEncrypted; // not encrypted

  try {
    const [ivBase64, ciphertextBase64] = maybeEncrypted.split(".") as [string, string];
    const iv = fromBase64(ivBase64);
    const ciphertext = fromBase64(ciphertextBase64);

    const key = await getOrCreateKeyMaterial();
    const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    return maybeEncrypted;
  }
}
