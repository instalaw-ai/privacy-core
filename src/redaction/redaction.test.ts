import assert from "node:assert/strict";
import { test } from "node:test";
import { redactText, normalizeText } from "./deterministic.js";

test("normalizeText: collapses whitespace", () => {
  assert.equal(normalizeText("hello\r\nworld\r\n\r\n\r\nfoo"), "hello\nworld\n\nfoo");
  assert.equal(normalizeText("  trailing  \n"), "trailing");
});

test("redactText: replaces email addresses", () => {
  const result = redactText("Contact john@example.com for details");
  assert.ok(result.text.includes("[EMAIL_1]"));
  assert.ok(!result.text.includes("john@example.com"));
  assert.equal(result.findingCount, 1);
  assert.ok(result.categories.includes("email"));
});

test("redactText: replaces phone numbers", () => {
  const result = redactText("Call (555) 123-4567 or 555-987-6543");
  assert.ok(result.text.includes("[PHONE_1]"));
  assert.ok(result.text.includes("[PHONE_2]"));
  assert.equal(result.findingCount, 2);
  assert.ok(result.categories.includes("phone"));
});

test("redactText: replaces SSNs", () => {
  const result = redactText("SSN: 123-45-6789");
  assert.ok(result.text.includes("[SSN_1]"));
  assert.ok(!result.text.includes("123-45-6789"));
});

test("redactText: replaces tax IDs", () => {
  const result = redactText("EIN: 12-3456789");
  assert.ok(result.text.includes("[TAX_ID_1]"));
});

test("redactText: replaces claim numbers", () => {
  const result = redactText("Claim #ABC-12345-XYZ regarding tariff");
  assert.ok(result.text.includes("[CLAIM_NUMBER_1]"));
});

test("redactText: replaces policy numbers", () => {
  const result = redactText("Policy #POL-98765-AA is expired");
  assert.ok(result.text.includes("[POLICY_NUMBER_1]"));
});

test("redactText: replaces account numbers", () => {
  const result = redactText("Account #ACC-11111-BB needs review");
  assert.ok(result.text.includes("[ACCOUNT_NUMBER_1]"));
});

test("redactText: same value gets same placeholder", () => {
  const result = redactText("Email john@example.com then john@example.com again");
  const matches = result.text.match(/\[EMAIL_1\]/g);
  assert.equal(matches?.length, 2);
  assert.equal(result.findingCount, 2);
});

test("redactText: different values get different placeholders", () => {
  const result = redactText("Contact john@example.com and jane@example.com");
  assert.ok(result.text.includes("[EMAIL_1]"));
  assert.ok(result.text.includes("[EMAIL_2]"));
});

test("redactText: handles empty input", () => {
  const result = redactText("");
  assert.equal(result.text, "");
  assert.equal(result.findingCount, 0);
  assert.equal(result.categories.length, 0);
});

test("redactText: preserves non-PII content", () => {
  const result = redactText("The tariff rate for HTS 0101.21 is 4.5% ad valorem.");
  assert.equal(result.text, "The tariff rate for HTS 0101.21 is 4.5% ad valorem.");
  assert.equal(result.findingCount, 0);
});

test("redactText: handles multiple PII types in one text", () => {
  const result = redactText(
    "Contact john@example.com at (555) 123-4567. SSN: 123-45-6789. Case #CASE-99999-ZZ."
  );
  assert.ok(result.text.includes("[EMAIL_1]"));
  assert.ok(result.text.includes("[PHONE_1]"));
  assert.ok(result.text.includes("[SSN_1]"));
  assert.ok(result.text.includes("[CLAIM_NUMBER_1]"));
  assert.ok(result.categories.includes("email"));
  assert.ok(result.categories.includes("phone"));
  assert.ok(result.categories.includes("ssn"));
  assert.ok(result.categories.includes("claim_number"));
});

test("redactText: replaces URLs", () => {
  const result = redactText("See https://acme-corp.com/clients/case-123 for details");
  assert.ok(result.text.includes("[URL_1]"));
  assert.ok(!result.text.includes("acme-corp.com"));
  assert.equal(result.findingCount, 1);
  assert.ok(result.categories.includes("url"));
});

test("redactText: replaces URLs with query parameters", () => {
  const result = redactText("File at https://portal.smithlaw.com/matters?client=acme&id=987");
  assert.ok(result.text.includes("[URL_1]"));
  assert.ok(!result.text.includes("smithlaw.com"));
  assert.ok(!result.text.includes("client=acme"));
});

test("redactText: replaces multiple different URLs", () => {
  const result = redactText(
    "Upload to https://internal.company.io/upload and check https://dashboard.company.io/status"
  );
  assert.ok(result.text.includes("[URL_1]"));
  assert.ok(result.text.includes("[URL_2]"));
  assert.equal(result.findingCount, 2);
});

test("redactText: same URL gets same placeholder", () => {
  const result = redactText(
    "Visit https://acme.com/login then https://acme.com/login again"
  );
  const matches = result.text.match(/\[URL_1\]/g);
  assert.equal(matches?.length, 2);
});

test("redactText: URL is redacted before email inside it would be extracted", () => {
  const result = redactText("Open https://example.com/user/john@test.com/profile");
  assert.ok(result.text.includes("[URL_1]"));
  // The email inside the URL should NOT be separately extracted
  assert.ok(!result.text.includes("[EMAIL_1]"));
});
