export type MarketType = "ATS" | "MONEYLINE" | "TOTAL" | "PROP";
export type TimeWindow = "1 PM" | "4 PM";
export type Grade = "A+" | "A" | "A-" | "B+" | "PASS";
export type EvidenceLayer = "model" | "experts" | "market" | "context";
export type SignalDirection = "supports" | "neutral" | "conflicts";

export interface SlateGame {
  id: string;
  season: number;
  week: number;
  date: string;
  time: string;
  timeWindow: TimeWindow;
  awayTeam: string;
  homeTeam: string;
  venue?: string;
  roof?: string;
  temperature?: number;
  windMph?: number;
  spread?: number;
  awaySpreadOdds?: number;
  homeSpreadOdds?: number;
  total?: number;
  overOdds?: number;
  underOdds?: number;
  awayMoneyline?: number;
  homeMoneyline?: number;
  status: "scheduled" | "final";
  source: string;
}

export interface WeatherSnapshot {
  gameId: string;
  status: "live" | "indoor" | "unavailable";
  temperatureF?: number;
  windMph?: number;
  precipitationProbability?: number;
  summary: string;
}

export interface InjurySnapshot {
  playerId: string;
  team: string;
  name: string;
  position?: string;
  designation: string;
  practiceParticipation?: string;
}

export interface PublicFeedStatus {
  id: "odds" | "weather" | "injuries";
  name: string;
  sourceUrl: string;
  status: "live" | "partial" | "unavailable";
  asOf: string;
  note: string;
}

export interface PublicContextResult {
  weather: WeatherSnapshot[];
  injuries: InjurySnapshot[];
  feeds: PublicFeedStatus[];
}

export interface CandidateInput {
  id: string;
  gameId: string;
  matchup: string;
  time: string;
  timeWindow: TimeWindow;
  market: MarketType;
  bet: string;
  sportsbookLine: string;
  americanOdds: number;
  openingLine?: string;
  currentLine: string;
  fairLine?: string;
  estimatedProbability: number;
  expertAgreement: number;
  expertSampleAdjustedScore: number;
  marketSignal: number;
  contextSignal: number;
  modelStrength: number;
  modelSummary: string;
  expertSummary: string;
  marketSummary: string;
  contextSummary: string;
  trend: number[];
  historical: {
    record: string;
    roi: number;
    sample: number;
    clv: number;
  };
}

export interface EvidenceSignal {
  layer: EvidenceLayer;
  label: string;
  summary: string;
  score: number;
  direction: SignalDirection;
}

export interface Recommendation extends CandidateInput {
  impliedProbability: number;
  edge: number;
  confidence: number;
  grade: Grade;
  qualifies: boolean;
  conflict: boolean;
  explanation: string;
  evidence: EvidenceSignal[];
}

export interface ScheduleSourceResult {
  games: SlateGame[];
  source: string;
  sourceUrl: string;
  asOf: string;
  slateDate?: string;
  status: "live" | "latest-available" | "fallback";
  note: string;
  context?: PublicContextResult;
}
