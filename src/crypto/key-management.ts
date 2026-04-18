import { bytesToBase64, base64ToBytes, toUint8Array } from "./encoding.js";

export async function createChannelKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function wrapKeyForDevice({
  key,
  publicKeyJwk,
}: {
  key: CryptoKey;
  publicKeyJwk: JsonWebKey;
}): Promise<string> {
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["wrapKey"]
  );
  const wrappedKey = await crypto.subtle.wrapKey("raw", key, publicKey, {
    name: "RSA-OAEP",
  });
  return bytesToBase64(toUint8Array(wrappedKey));
}

export async function unwrapKeyForDevice({
  privateKey,
  wrappedKey,
}: {
  privateKey: CryptoKey;
  wrappedKey: string;
}): Promise<CryptoKey> {
  return crypto.subtle.unwrapKey(
    "raw",
    base64ToBytes(wrappedKey),
    privateKey,
    { name: "RSA-OAEP" },
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return bytesToBase64(toUint8Array(raw));
}

export async function importKeyFromBase64(base64Key: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    base64ToBytes(base64Key),
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}
