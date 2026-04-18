import {
  bytesToBase64,
  base64ToBytes,
  toUint8Array,
  textToBytes,
  bytesToText,
} from "./encoding.js";

export interface EncryptedFile {
  ciphertext: string;
  iv: string;
  metadata: string; // encrypted JSON with original filename, contentType, size
}

export interface FileMetadata {
  filename: string;
  contentType: string;
  size: number;
}

export async function encryptFile({
  key,
  file,
  metadata,
}: {
  key: CryptoKey;
  file: ArrayBuffer;
  metadata: FileMetadata;
}): Promise<EncryptedFile> {
  const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>;
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new Uint8Array(file) as Uint8Array<ArrayBuffer>
  );

  const metadataIv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>;
  const metadataCiphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: metadataIv },
    key,
    textToBytes(JSON.stringify(metadata))
  );

  return {
    ciphertext: bytesToBase64(toUint8Array(ciphertext)),
    iv: bytesToBase64(iv),
    metadata: [
      bytesToBase64(metadataIv),
      bytesToBase64(toUint8Array(metadataCiphertext)),
    ].join("."),
  };
}

export async function decryptFile({
  key,
  encryptedFile,
}: {
  key: CryptoKey;
  encryptedFile: EncryptedFile;
}): Promise<{ file: ArrayBuffer; metadata: FileMetadata }> {
  const file = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(encryptedFile.iv) },
    key,
    base64ToBytes(encryptedFile.ciphertext)
  );

  const [metadataIvStr, metadataCiphertextStr] = encryptedFile.metadata.split(".");
  const metadataPlaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(metadataIvStr) },
    key,
    base64ToBytes(metadataCiphertextStr)
  );

  return {
    file,
    metadata: JSON.parse(bytesToText(metadataPlaintext)) as FileMetadata,
  };
}
