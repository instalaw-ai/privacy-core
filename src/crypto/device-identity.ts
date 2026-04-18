import { bytesToHex, toUint8Array, textToBytes } from "./encoding.js";

function sortDeep(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    if (Array.isArray(value)) {
      return value.map((entry) => sortDeep(entry));
    }
    return value;
  }
  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((accumulator, key) => {
      accumulator[key] = sortDeep((value as Record<string, unknown>)[key]);
      return accumulator;
    }, {});
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

export interface DeviceIdentity {
  deviceId: string;
  publicKeyFingerprint: string;
  privateKeyJwk: JsonWebKey;
  publicKeyJwk: JsonWebKey;
}

export async function createDeviceIdentity(): Promise<DeviceIdentity> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]) as Uint8Array<ArrayBuffer>,
      hash: "SHA-256",
    },
    true,
    ["wrapKey", "unwrapKey"]
  );

  const publicKeyJwk = (await crypto.subtle.exportKey("jwk", keyPair.publicKey)) as JsonWebKey;
  const privateKeyJwk = (await crypto.subtle.exportKey("jwk", keyPair.privateKey)) as JsonWebKey;
  const fingerprintBuffer = await crypto.subtle.digest(
    "SHA-256",
    textToBytes(stableStringify(publicKeyJwk))
  );

  return {
    deviceId: crypto.randomUUID(),
    publicKeyFingerprint: bytesToHex(toUint8Array(fingerprintBuffer)),
    privateKeyJwk,
    publicKeyJwk,
  };
}

export function importDevicePrivateKey(privateKeyJwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["unwrapKey"]
  );
}

export function importDevicePublicKey(publicKeyJwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["wrapKey"]
  );
}
