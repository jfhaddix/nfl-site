import assert from "node:assert/strict";
import test from "node:test";
import { americanOddsToImpliedProbability, adjustedExpertRate, scoreCandidate } from "../lib/nfl/scoring.ts";
import { demoCandidates } from "../lib/nfl/demo-data.ts";

test("converts American odds to implied probability", () => {
  assert.ok(Math.abs(americanOddsToImpliedProbability(-110) - 0.52381) < 0.0001);
  assert.equal(americanOddsToImpliedProbability(150), 0.4);
});

test("sample-size adjustment prevents a small hot streak from outranking durable performance", () => {
  const smallSample = adjustedExpertRate(13, 7);
  const durableSample = adjustedExpertRate(840, 660);
  assert.ok(smallSample < durableSample);
  assert.ok(smallSample < 0.55);
});

test("moneyline scoring separates win probability from price value", () => {
  const candidate = demoCandidates.find((item) => item.market === "MONEYLINE");
  assert.ok(candidate);
  const recommendation = scoreCandidate(candidate);
  assert.ok(recommendation.estimatedProbability > 0.7);
  assert.ok(recommendation.edge < 0.04);
  assert.notEqual(recommendation.grade, "A+");
});

test("market conflict remains visible and lowers confidence", () => {
  const conflict = demoCandidates.find((item) => item.id === "sf-sea-spread-conflict");
  assert.ok(conflict);
  const flagged = scoreCandidate(conflict);
  const aligned = scoreCandidate({ ...conflict, id: "aligned", marketSignal: 0.75 });
  assert.equal(flagged.conflict, true);
  assert.equal(flagged.grade, "PASS");
  assert.ok(flagged.confidence < aligned.confidence);
});

test("a high win probability can still fail the value threshold", () => {
  const candidate = demoCandidates.find((item) => item.id === "dal-nyg-ml-pass");
  assert.ok(candidate);
  const result = scoreCandidate(candidate);
  assert.equal(result.qualifies, false);
  assert.equal(result.grade, "PASS");
});
