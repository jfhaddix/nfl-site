import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const games = sqliteTable("games", {
  id: text("id").primaryKey(),
  season: integer("season").notNull(),
  week: integer("week").notNull(),
  gameDate: text("game_date").notNull(),
  gameTime: text("game_time").notNull(),
  awayTeam: text("away_team").notNull(),
  homeTeam: text("home_team").notNull(),
  status: text("status").notNull().default("scheduled"),
  source: text("source").notNull(),
  sourcePayload: text("source_payload", { mode: "json" }),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("idx_games_season_week").on(table.season, table.week),
  index("idx_games_game_date").on(table.gameDate),
]);

export const recommendations = sqliteTable("recommendations", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull().references(() => games.id),
  recommendedAt: text("recommended_at").notNull(),
  marketType: text("market_type").notNull(),
  betLabel: text("bet_label").notNull(),
  lineAtRecommendation: text("line_at_recommendation").notNull(),
  americanOdds: integer("american_odds").notNull(),
  estimatedProbability: real("estimated_probability").notNull(),
  impliedProbability: real("implied_probability").notNull(),
  modelEdge: real("model_edge").notNull(),
  confidence: integer("confidence").notNull(),
  grade: text("grade").notNull(),
  expertAgreement: real("expert_agreement").notNull(),
  marketSignal: real("market_signal").notNull(),
  contextSignal: real("context_signal").notNull(),
  conflict: integer("conflict", { mode: "boolean" }).notNull().default(false),
  modelVersion: text("model_version").notNull(),
}, (table) => [
  index("idx_recommendations_recommended_at").on(table.recommendedAt),
  index("idx_recommendations_market_confidence").on(table.marketType, table.confidence),
  index("idx_recommendations_game_id").on(table.gameId),
]);

export const evidenceSnapshots = sqliteTable("evidence_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recommendationId: text("recommendation_id").notNull().references(() => recommendations.id),
  layer: text("layer").notNull(),
  source: text("source").notNull(),
  signalScore: real("signal_score").notNull(),
  direction: text("direction").notNull(),
  valuePayload: text("value_payload", { mode: "json" }).notNull(),
  capturedAt: text("captured_at").notNull(),
}, (table) => [
  index("idx_evidence_recommendation_layer").on(table.recommendationId, table.layer),
]);

export const recommendationResults = sqliteTable("recommendation_results", {
  recommendationId: text("recommendation_id").primaryKey().references(() => recommendations.id),
  closingLine: text("closing_line"),
  closingAmericanOdds: integer("closing_american_odds"),
  result: text("result").notNull().default("pending"),
  profitLossUnits: real("profit_loss_units"),
  closingLineValue: real("closing_line_value"),
  settledAt: text("settled_at"),
}, (table) => [
  index("idx_results_result").on(table.result),
]);

export const experts = sqliteTable("experts", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  source: text("source").notNull(),
  profileUrl: text("profile_url"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const expertMarketRecords = sqliteTable("expert_market_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  expertId: text("expert_id").notNull().references(() => experts.id),
  marketType: text("market_type").notNull(),
  wins: integer("wins").notNull(),
  losses: integer("losses").notNull(),
  pushes: integer("pushes").notNull().default(0),
  units: real("units").notNull(),
  roi: real("roi").notNull(),
  sampleAdjustedRate: real("sample_adjusted_rate").notNull(),
  periodStart: text("period_start"),
  periodEnd: text("period_end"),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("idx_expert_records_expert_market").on(table.expertId, table.marketType),
]);
