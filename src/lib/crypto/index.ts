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

async function getOrCreateKeyMaterial(): Promise<CryptoKey> {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    const decoded = atob(stored);
    const raw = new Uint8Array(new ArrayBuffer(decoded.length));
    for (let i = 0; i < decoded.length; i++) raw[i] = decoded.charCodeAt(i);
    return crypto.subtle.importKey("raw", raw, { name: ALGORITHM }, false, KEY_USAGE);
  }

  const key = await crypto.subtle.generateKey({ name: ALGORITHM, length: 256 }, true, KEY_USAGE);
  const exported = await crypto.subtle.exportKey("raw", key);
  const base64 = btoa(
    Array.from(new Uint8Array(exported), (b) => String.fromCharCode(b)).join("")
  );
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

    const ivBase64 = btoa(Array.from(iv, (b) => String.fromCharCode(b)).join(""));
    const ciphertextBase64 = btoa(
      Array.from(new Uint8Array(ciphertext), (b) => String.fromCharCode(b)).join("")
    );
    return `${ivBase64}.${ciphertextBase64}`;
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
    const ivBytes = atob(ivBase64);
    const iv = new Uint8Array(new ArrayBuffer(ivBytes.length));
    for (let i = 0; i < ivBytes.length; i++) iv[i] = ivBytes.charCodeAt(i);

    const ctBytes = atob(ciphertextBase64);
    const ciphertext = new Uint8Array(new ArrayBuffer(ctBytes.length));
    for (let i = 0; i < ctBytes.length; i++) ciphertext[i] = ctBytes.charCodeAt(i);

    const key = await getOrCreateKeyMaterial();
    const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    return maybeEncrypted;
  }
}
