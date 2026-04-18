import assert from "node:assert/strict";
import { test } from "node:test";
import { coarsenTimestamp, coarsenedNow, formatCoarsenedTimestamp } from "./timestamps.js";

test("coarsenTimestamp: hour precision zeros minutes and seconds", () => {
  const date = new Date("2026-04-07T14:32:17.482Z");
  const coarsened = coarsenTimestamp(date, "hour");
  assert.equal(coarsened.toISOString(), "2026-04-07T14:00:00.000Z");
});

test("coarsenTimestamp: day precision zeros hours, minutes, seconds", () => {
  const date = new Date("2026-04-07T14:32:17.482Z");
  const coarsened = coarsenTimestamp(date, "day");
  assert.equal(coarsened.toISOString(), "2026-04-07T00:00:00.000Z");
});

test("coarsenTimestamp: does not mutate original date", () => {
  const date = new Date("2026-04-07T14:32:17.482Z");
  const original = date.toISOString();
  coarsenTimestamp(date, "hour");
  assert.equal(date.toISOString(), original);
});

test("coarsenedNow: returns a date with zeroed minutes", () => {
  const result = coarsenedNow("hour");
  assert.equal(result.getUTCMinutes(), 0);
  assert.equal(result.getUTCSeconds(), 0);
  assert.equal(result.getUTCMilliseconds(), 0);
});

test("formatCoarsenedTimestamp: today shows 'Today'", () => {
  const now = new Date();
  assert.equal(formatCoarsenedTimestamp(now), "Today");
});

test("formatCoarsenedTimestamp: yesterday shows 'Yesterday'", () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  assert.equal(formatCoarsenedTimestamp(yesterday), "Yesterday");
});

test("formatCoarsenedTimestamp: 3 days ago shows '3 days ago'", () => {
  const date = new Date();
  date.setDate(date.getDate() - 3);
  assert.equal(formatCoarsenedTimestamp(date), "3 days ago");
});

test("formatCoarsenedTimestamp: old date shows formatted date", () => {
  const date = new Date("2025-01-15T00:00:00.000Z");
  const result = formatCoarsenedTimestamp(date);
  assert.ok(result.includes("2025"));
  assert.ok(result.includes("Jan"));
});
