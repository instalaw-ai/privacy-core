import {
  bytesToBase64,
  base64ToBytes,
  textToBytes,
  bytesToText,
  toUint8Array,
} from "./encoding.js";

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
}

export async function encryptMessage({
  key,
  plaintext,
}: {
  key: CryptoKey;
  plaintext: string;
}): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>;
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textToBytes(plaintext)
  );
  return {
    ciphertext: bytesToBase64(toUint8Array(ciphertext)),
    iv: bytesToBase64(iv),
  };
}

export async function decryptMessage({
  key,
  ciphertext,
  iv,
}: {
  key: CryptoKey;
  ciphertext: string;
  iv: string;
}): Promise<string> {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ciphertext)
  );
  return bytesToText(plaintext);
}
