import { bytesToBase64, bytesToHex, textToBytes, toUint8Array } from "../crypto/encoding.js";

/**
 * Derive a key from a passphrase using PBKDF2.
 * Used for passphrase-based authentication. The server stores the derived hash;
 * the passphrase never leaves the client.
 *
 * Uses PBKDF2 with SHA-256 and 600,000 iterations (OWASP recommendation).
 * In production, the server should re-hash the received key with a server-side
 * algorithm (bcrypt/argon2id) before storage.
 */
export async function derivePassphraseKey({
  passphrase,
  salt,
  iterations = 600_000,
}: {
  passphrase: string;
  salt: Uint8Array<ArrayBuffer>;
  iterations?: number;
}): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textToBytes(passphrase),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return bytesToHex(toUint8Array(derivedBits));
}

/**
 * Generate a random salt for passphrase derivation.
 * Store this alongside the user record (it is not secret).
 */
export function generateSalt(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(32)) as Uint8Array<ArrayBuffer>;
}

/**
 * Serialize a salt to base64 for storage.
 */
export function saltToBase64(salt: Uint8Array): string {
  return bytesToBase64(salt);
}

/**
 * Deserialize a salt from base64 storage.
 */
export function saltFromBase64(base64Salt: string): Uint8Array<ArrayBuffer> {
  const binary = globalThis.atob(base64Salt);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes as Uint8Array<ArrayBuffer>;
}

/**
 * Generate a recovery key — a random 256-bit key displayed once to the user.
 * Stored server-side as a hash for verification during recovery.
 */
export function generateRecoveryKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32)) as Uint8Array<ArrayBuffer>;
  // Format as groups of 5 characters for readability
  const hex = bytesToHex(bytes);
  return hex.match(/.{1,5}/g)!.join("-");
}

/**
 * Hash a recovery key for server-side storage.
 */
export async function hashRecoveryKey(recoveryKey: string): Promise<string> {
  const normalized = recoveryKey.replaceAll("-", "").toLowerCase();
  const digest = await crypto.subtle.digest("SHA-256", textToBytes(normalized));
  return bytesToHex(toUint8Array(digest));
}

/**
 * Hash an email address for privacy-preserving recovery lookup.
 * The server stores only this hash, never the plaintext email.
 */
export async function hashEmail(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const digest = await crypto.subtle.digest("SHA-256", textToBytes(normalized));
  return bytesToHex(toUint8Array(digest));
}
