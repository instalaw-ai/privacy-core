import assert from "node:assert/strict";
import { test } from "node:test";
import {
  derivePassphraseKey,
  generateSalt,
  saltToBase64,
  saltFromBase64,
  generateRecoveryKey,
  hashRecoveryKey,
  hashEmail,
} from "./passphrase.js";

test("passphrase: derives consistent key from same input", async () => {
  const salt = generateSalt();
  const key1 = await derivePassphraseKey({ passphrase: "my-secret-phrase", salt });
  const key2 = await derivePassphraseKey({ passphrase: "my-secret-phrase", salt });
  assert.equal(key1, key2);
});

test("passphrase: different passphrases produce different keys", async () => {
  const salt = generateSalt();
  const key1 = await derivePassphraseKey({ passphrase: "phrase-one", salt });
  const key2 = await derivePassphraseKey({ passphrase: "phrase-two", salt });
  assert.notEqual(key1, key2);
});

test("passphrase: different salts produce different keys", async () => {
  const salt1 = generateSalt();
  const salt2 = generateSalt();
  const key1 = await derivePassphraseKey({ passphrase: "same", salt: salt1 });
  const key2 = await derivePassphraseKey({ passphrase: "same", salt: salt2 });
  assert.notEqual(key1, key2);
});

test("passphrase: derived key is 64-char hex string (256 bits)", async () => {
  const salt = generateSalt();
  const key = await derivePassphraseKey({ passphrase: "test", salt });
  assert.equal(key.length, 64);
  assert.match(key, /^[0-9a-f]{64}$/);
});

test("salt: round-trips through base64", () => {
  const original = generateSalt();
  const b64 = saltToBase64(original);
  const recovered = saltFromBase64(b64);
  assert.deepEqual(recovered, original);
});

test("salt: is 32 bytes", () => {
  const salt = generateSalt();
  assert.equal(salt.length, 32);
});

test("recovery key: is formatted with dashes", () => {
  const key = generateRecoveryKey();
  assert.ok(key.includes("-"));
  // Should be hex characters and dashes only
  assert.match(key.replaceAll("-", ""), /^[0-9a-f]+$/);
});

test("recovery key: hash is deterministic", async () => {
  const key = generateRecoveryKey();
  const hash1 = await hashRecoveryKey(key);
  const hash2 = await hashRecoveryKey(key);
  assert.equal(hash1, hash2);
});

test("recovery key: hash ignores dashes and case", async () => {
  const hash1 = await hashRecoveryKey("abcde-12345");
  const hash2 = await hashRecoveryKey("ABCDE12345");
  assert.equal(hash1, hash2);
});

test("email hash: is deterministic", async () => {
  const hash1 = await hashEmail("Test@Example.COM");
  const hash2 = await hashEmail("test@example.com");
  assert.equal(hash1, hash2);
});

test("email hash: different emails produce different hashes", async () => {
  const hash1 = await hashEmail("alice@example.com");
  const hash2 = await hashEmail("bob@example.com");
  assert.notEqual(hash1, hash2);
});

test("email hash: is 64-char hex (SHA-256)", async () => {
  const hash = await hashEmail("test@example.com");
  assert.equal(hash.length, 64);
  assert.match(hash, /^[0-9a-f]{64}$/);
});
