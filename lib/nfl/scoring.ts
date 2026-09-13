import type { CandidateInput, EvidenceSignal, Grade, Recommendation } from "./types";

export const QUALITY_THRESHOLD = 76;

export function americanOddsToImpliedProbability(odds: number): number {
  if (odds === 0) throw new Error("American odds cannot be zero.");
  return odds < 0 ? Math.abs(odds) / (Math.abs(odds) + 100) : 100 / (odds + 100);
}

export function adjustedExpertRate(wins: number, losses: number, prior = 0.5, priorWeight = 80): number {
  const sample = wins + losses;
  if (sample <= 0) return prior;
  return (wins + prior * priorWeight) / (sample + priorWeight);
}

export function gradeForConfidence(confidence: number): Grade {
  if (confidence >= 93) return "A+";
  if (confidence >= 87) return "A";
  if (confidence >= 82) return "A-";
  if (confidence >= QUALITY_THRESHOLD) return "B+";
  return "PASS";
}

function direction(score: number): "supports" | "neutral" | "conflicts" {
  if (score >= 0.58) return "supports";
  if (score <= 0.42) return "conflicts";
  return "neutral";
}

export function scoreCandidate(candidate: CandidateInput): Recommendation {
  const impliedProbability = americanOddsToImpliedProbability(candidate.americanOdds);
  const edge = candidate.estimatedProbability - impliedProbability;
  const conflict = candidate.modelStrength >= 0.62 && candidate.marketSignal <= 0.38;
  const edgeScore = Math.max(0, Math.min(1, edge / 0.1));
  const agreementScore = candidate.expertAgreement * 0.6 + candidate.expertSampleAdjustedScore * 0.4;
  const rawConfidence = 48
    + edgeScore * 22
    + candidate.modelStrength * 11
    + agreementScore * 9
    + candidate.marketSignal * 6
    + candidate.contextSignal * 4
    - (conflict ? 8 : 0);
  const confidence = Math.max(0, Math.min(99, Math.round(rawConfidence)));
  const grade = gradeForConfidence(confidence);
  const qualifies = grade !== "PASS" && edge >= 0.025;

  const evidence: EvidenceSignal[] = [
    { layer: "model", label: "MODEL", summary: candidate.modelSummary, score: candidate.modelStrength, direction: direction(candidate.modelStrength) },
    { layer: "experts", label: "EXPERTS", summary: candidate.expertSummary, score: agreementScore, direction: direction(agreementScore) },
    { layer: "market", label: "MARKET", summary: candidate.marketSummary, score: candidate.marketSignal, direction: direction(candidate.marketSignal) },
    { layer: "context", label: "NEWS", summary: candidate.contextSummary, score: candidate.contextSignal, direction: direction(candidate.contextSignal) },
  ];

  const strongest = [...evidence].sort((a, b) => b.score - a.score)[0];
  const explanation = conflict
    ? `${candidate.modelSummary} Market movement disagrees, so confidence is reduced.`
    : `${strongest.label.toLowerCase()} support leads: ${strongest.summary}`;

  return { ...candidate, impliedProbability, edge, confidence, grade: qualifies ? grade : "PASS", qualifies, conflict, explanation, evidence };
}

export function scoreSlate(candidates: CandidateInput[]): Recommendation[] {
  return candidates.map(scoreCandidate).sort((a, b) => b.confidence - a.confidence || b.edge - a.edge);
}
