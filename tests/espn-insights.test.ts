import assert from "node:assert/strict";
import test from "node:test";
import { ESPN_WEEK_1_SOURCE, espnWeek1Insights } from "../lib/nfl/espn-insights.ts";

test("ESPN+ research notes are uniquely identified and never score recommendations", () => {
  assert.equal(new Set(espnWeek1Insights.map((item) => item.id)).size, espnWeek1Insights.length);
  assert.ok(espnWeek1Insights.length > 0);
  for (const item of espnWeek1Insights) {
    assert.equal(item.influence, "context-only");
    assert.equal(item.trackedSample, 0);
    assert.match(item.gameId, /^2026_01_/);
    assert.ok(item.summary.length < 180);
  }
});

test("ESPN+ snapshot is attributed to a dated HTTPS source", () => {
  assert.match(ESPN_WEEK_1_SOURCE.url, /^https:\/\/www\.espn\.com\//);
  assert.equal(ESPN_WEEK_1_SOURCE.publishedAt, "2026-09-11");
  assert.equal(ESPN_WEEK_1_SOURCE.access, "Permissioned manual snapshot");
});
