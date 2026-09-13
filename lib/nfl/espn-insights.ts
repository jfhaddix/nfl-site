import type { MarketType } from "./types";

export interface ExpertInsight {
  id: string;
  gameId: string;
  matchup: string;
  analyst: string;
  market: MarketType;
  bet: string;
  price: string;
  summary: string;
  influence: "context-only";
  trackedSample: 0;
}

export const ESPN_WEEK_1_SOURCE = {
  name: "ESPN+ Week 1 betting analysis",
  publishedAt: "2026-09-11",
  capturedAt: "2026-09-12",
  url: "https://www.espn.com/espn/betting/story/_/id/49488943/week-1-nfl-odds-spreads-lines-props-best-bets-sunday-football-games",
  access: "Permissioned manual snapshot",
} as const;

// These are concise, attributed research notes—not a replica of subscriber content.
// Until settled picks establish a tracked 2026 sample, they cannot raise a model grade.
export const espnWeek1Insights: ExpertInsight[] = [
  {
    id: "espn-bowen-chi-car-ats",
    gameId: "2026_01_CHI_CAR",
    matchup: "CHI at CAR",
    analyst: "Matt Bowen",
    market: "ATS",
    bet: "Bears -3",
    price: "-3",
    summary: "Chicago's offensive matchup against Carolina's zone-heavy structure and run defense supports the side.",
    influence: "context-only",
    trackedSample: 0,
  },
  {
    id: "espn-bowen-chi-car-total",
    gameId: "2026_01_CHI_CAR",
    matchup: "CHI at CAR",
    analyst: "Matt Bowen",
    market: "TOTAL",
    bet: "Over 46.5",
    price: "46.5",
    summary: "Defensive vulnerability against the run on both sides creates multiple paths to sustained drives and points.",
    influence: "context-only",
    trackedSample: 0,
  },
  {
    id: "espn-bowen-swift-receiving",
    gameId: "2026_01_CHI_CAR",
    matchup: "CHI at CAR",
    analyst: "Matt Bowen",
    market: "PROP",
    bet: "D'Andre Swift receiving yards over 14.5",
    price: "-107",
    summary: "Carolina's zone tendencies could create checkdown and underneath receiving opportunities for Swift.",
    influence: "context-only",
    trackedSample: 0,
  },
  {
    id: "espn-solak-tb-cin-under",
    gameId: "2026_01_TB_CIN",
    matchup: "TB at CIN",
    analyst: "Ben Solak",
    market: "TOTAL",
    bet: "Under 50.5",
    price: "-112",
    summary: "Defensive changes, limited preseason work and early-season offensive rust support the under; 51 or better is preferred.",
    influence: "context-only",
    trackedSample: 0,
  },
  {
    id: "espn-solak-montgomery-touchdown",
    gameId: "2026_01_BUF_HOU",
    matchup: "BUF at HOU",
    analyst: "Ben Solak",
    market: "PROP",
    bet: "David Montgomery anytime touchdown",
    price: "-115",
    summary: "A projected goal-line role and Houston's physical blocking matchup support Montgomery near the end zone.",
    influence: "context-only",
    trackedSample: 0,
  },
  {
    id: "espn-solak-tuten-receiving",
    gameId: "2026_01_CLE_JAX",
    matchup: "CLE at JAX",
    analyst: "Ben Solak",
    market: "PROP",
    bet: "Bhayshul Tuten receiving yards under 11.5",
    price: "-117",
    summary: "An uncertain passing-down role, route participation and pass protection limit the projected receiving opportunity.",
    influence: "context-only",
    trackedSample: 0,
  },
  {
    id: "espn-walder-hines-allen-sacks",
    gameId: "2026_01_CLE_JAX",
    matchup: "CLE at JAX",
    analyst: "Seth Walder",
    market: "PROP",
    bet: "Josh Hines-Allen over 0.25 sacks",
    price: "+126",
    summary: "Cleveland's quarterback sack history, offensive-line turnover and likely passing script strengthen the matchup.",
    influence: "context-only",
    trackedSample: 0,
  },
  {
    id: "espn-walder-tampa-defense-touchdown",
    gameId: "2026_01_TB_CIN",
    matchup: "TB at CIN",
    analyst: "Seth Walder",
    market: "PROP",
    bet: "Tampa Bay D/ST anytime touchdown",
    price: "+650",
    summary: "An aggressive blitz plan against a reworked Cincinnati protection scheme creates turnover-return upside.",
    influence: "context-only",
    trackedSample: 0,
  },
];
