const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function textToBytes(value: string): Uint8Array<ArrayBuffer> {
  return encoder.encode(value) as Uint8Array<ArrayBuffer>;
}

export function bytesToText(value: ArrayBuffer | Uint8Array): string {
  return decoder.decode(value);
}

export function toUint8Array(value: ArrayBuffer | Uint8Array): Uint8Array<ArrayBuffer> {
  return (value instanceof Uint8Array ? value : new Uint8Array(value)) as Uint8Array<ArrayBuffer>;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return globalThis.btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes as Uint8Array<ArrayBuffer>;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
