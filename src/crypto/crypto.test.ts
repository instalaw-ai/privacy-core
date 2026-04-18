import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDeviceIdentity,
  importDevicePrivateKey,
  createChannelKey,
  wrapKeyForDevice,
  unwrapKeyForDevice,
  encryptMessage,
  decryptMessage,
  encryptFile,
  decryptFile,
  exportKeyToBase64,
  importKeyFromBase64,
  bytesToBase64,
  base64ToBytes,
  bytesToHex,
} from "./index.js";

test("encoding: base64 round-trip", () => {
  const original = new Uint8Array([72, 101, 108, 108, 111]);
  const b64 = bytesToBase64(original);
  const decoded = base64ToBytes(b64);
  assert.deepEqual(decoded, original);
});

test("encoding: bytesToHex produces correct hex", () => {
  const bytes = new Uint8Array([0, 15, 255]);
  assert.equal(bytesToHex(bytes), "000fff");
});

test("device identity: generates valid RSA keypair", async () => {
  const identity = await createDeviceIdentity();
  assert.equal(typeof identity.deviceId, "string");
  assert.ok(identity.deviceId.length > 0);
  assert.equal(typeof identity.publicKeyFingerprint, "string");
  assert.ok(identity.publicKeyFingerprint.length >= 32);
  assert.equal(identity.publicKeyJwk.kty, "RSA");
  assert.equal(identity.privateKeyJwk.kty, "RSA");
});

test("device identity: two identities produce different fingerprints", async () => {
  const a = await createDeviceIdentity();
  const b = await createDeviceIdentity();
  assert.notEqual(a.publicKeyFingerprint, b.publicKeyFingerprint);
  assert.notEqual(a.deviceId, b.deviceId);
});

test("key management: wrap and unwrap channel key", async () => {
  const identity = await createDeviceIdentity();
  const privateKey = await importDevicePrivateKey(identity.privateKeyJwk);
  const channelKey = await createChannelKey();

  const wrapped = await wrapKeyForDevice({
    key: channelKey,
    publicKeyJwk: identity.publicKeyJwk,
  });

  assert.equal(typeof wrapped, "string");
  assert.ok(wrapped.length > 0);

  const unwrapped = await unwrapKeyForDevice({ privateKey, wrappedKey: wrapped });

  // Verify by encrypting with one and decrypting with the other
  const payload = await encryptMessage({ key: channelKey, plaintext: "test" });
  const plaintext = await decryptMessage({ key: unwrapped, ciphertext: payload.ciphertext, iv: payload.iv });
  assert.equal(plaintext, "test");
});

test("key management: export and import key round-trip", async () => {
  const key = await createChannelKey();
  const exported = await exportKeyToBase64(key);
  const imported = await importKeyFromBase64(exported);

  const payload = await encryptMessage({ key, plaintext: "round-trip" });
  const plaintext = await decryptMessage({ key: imported, ciphertext: payload.ciphertext, iv: payload.iv });
  assert.equal(plaintext, "round-trip");
});

test("message encryption: round-trips plaintext", async () => {
  const key = await createChannelKey();
  const payload = await encryptMessage({
    key,
    plaintext: "Tariff refund packet is ready for counsel review.",
  });

  assert.equal(typeof payload.ciphertext, "string");
  assert.equal(typeof payload.iv, "string");
  assert.ok(!payload.ciphertext.includes("Tariff"));

  const plaintext = await decryptMessage({ key, ciphertext: payload.ciphertext, iv: payload.iv });
  assert.equal(plaintext, "Tariff refund packet is ready for counsel review.");
});

test("message encryption: different IVs for same plaintext", async () => {
  const key = await createChannelKey();
  const a = await encryptMessage({ key, plaintext: "same" });
  const b = await encryptMessage({ key, plaintext: "same" });
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.ciphertext, b.ciphertext);
});

test("message encryption: wrong key fails to decrypt", async () => {
  const key1 = await createChannelKey();
  const key2 = await createChannelKey();
  const payload = await encryptMessage({ key: key1, plaintext: "secret" });

  await assert.rejects(
    () => decryptMessage({ key: key2, ciphertext: payload.ciphertext, iv: payload.iv }),
    /error|operation|decrypt/i
  );
});

test("message encryption: handles empty string", async () => {
  const key = await createChannelKey();
  const payload = await encryptMessage({ key, plaintext: "" });
  const result = await decryptMessage({ key, ciphertext: payload.ciphertext, iv: payload.iv });
  assert.equal(result, "");
});

test("message encryption: handles unicode", async () => {
  const key = await createChannelKey();
  const text = "Hello \u{1F600} world \u{4E16}\u{754C}";
  const payload = await encryptMessage({ key, plaintext: text });
  const result = await decryptMessage({ key, ciphertext: payload.ciphertext, iv: payload.iv });
  assert.equal(result, text);
});

test("file encryption: round-trips file content and metadata", async () => {
  const key = await createChannelKey();
  const content = new TextEncoder().encode("file content here");
  const metadata = { filename: "test.pdf", contentType: "application/pdf", size: 1234 };

  const encrypted = await encryptFile({
    key,
    file: content.buffer as ArrayBuffer,
    metadata,
  });

  assert.equal(typeof encrypted.ciphertext, "string");
  assert.equal(typeof encrypted.iv, "string");
  assert.equal(typeof encrypted.metadata, "string");
  assert.ok(!encrypted.ciphertext.includes("file content"));

  const decrypted = await decryptFile({ key, encryptedFile: encrypted });
  assert.deepEqual(new Uint8Array(decrypted.file), content);
  assert.deepEqual(decrypted.metadata, metadata);
});
