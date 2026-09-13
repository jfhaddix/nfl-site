# Sunday Edge

Sunday Edge is an NFL betting-analysis vertical slice for Sunday daytime games
at 1:00, 4:05, and 4:25 PM ET. It excludes Thursday, Sunday night, Monday
night, international morning, and other non-eligible windows.

The dashboard is intentionally transparent: nflverse loads the current schedule
and public consensus prices, Open-Meteo supplies kickoff weather, and Sleeper's
read-only player feed supplies injury designations. None requires a user account
or API key. Recommendation inputs remain labeled demo data. A permissioned,
manually distilled ESPN+ Week 1 snapshot is context only and cannot change model
grades until tracked outcomes establish a sample.

## Technology stack

- Vinext / React 19 / TypeScript for the full-stack application
- Cloudflare Worker-compatible server output through the Sites Vite plugin
- Cloudflare D1 + Drizzle ORM for recommendations, evidence snapshots, expert
  records, results, units, and closing-line value
- Plain React state for the small interactive filter surface
- Node's built-in test runner for deterministic scoring and adapter tests

This keeps v1 small: no global state framework, charting package, job queue, or
separate API service is needed yet.

## Architecture

```text
app/
  api/slate/route.ts              HTTP boundary for current eligible games
  page.tsx                        Dashboard and interactive filters
db/
  schema.ts                       D1 history and evidence schema
drizzle/                          Generated SQL migrations
lib/nfl/
  adapters/
    source-adapter.ts             Schedule/expert/market/context contracts
    nflverse-schedule.ts          Schedule, spread, ML, total, and price adapter
    open-meteo-weather.ts         No-key kickoff forecast adapter
    sleeper-injuries.ts           No-token player designation adapter
    public-fetch.ts               Edge caching for credential-free JSON feeds
  demo-data.ts                    Clearly labeled recommendation fixture
  espn-insights.ts                Attributed, context-only ESPN+ research notes
  scoring.ts                      Probability, edge, confidence, grade logic
  service.ts                      Adapter orchestration and safe fallback
  types.ts                        Domain model
tests/
  nfl-scoring.test.ts             Probability and quality-gate tests
  nflverse-adapter.test.ts        Sunday/time-window filtering tests
```

Data flow:

```text
source adapters → normalized features → candidate scoring → quality gate
       → dashboard
       → D1 recommendation + evidence snapshot → result/CLV settlement
```

The core only consumes normalized interfaces, so a source can be added or
removed without changing the scoring contract or dashboard.

## Database schema

- `games`: normalized schedule row plus a JSON source snapshot
- `recommendations`: line and price at recommendation time, model and implied
  probabilities, edge, confidence, grade, agreement signals, and model version
- `evidence_snapshots`: one immutable model/expert/market/context snapshot per
  recommendation layer
- `recommendation_results`: closing line, outcome, unit profit/loss, and CLV
- `experts`: source identity and permitted profile reference
- `expert_market_records`: ATS/ML/total/prop performance, units, ROI, sample
  size, and the sample-adjusted rate used in scoring

Indexes follow the first reporting queries: games by season/week and date,
recommendations by date and market/confidence, evidence by recommendation/layer,
and results by status.

## Source policy

The implemented public adapters require no login or secret:

- nflverse: schedule, spread, moneyline, total, and market prices
- Open-Meteo: kickoff temperature, wind, and precipitation probability
- Sleeper: current player injury designation and practice participation

nflverse and Open-Meteo data use CC BY 4.0 terms. Sleeper documents its API as
free for non-commercial, read-only use and requests that the player directory be
fetched no more than daily; the adapter applies a 24-hour edge-cache lifetime.
Review provider terms before commercial redistribution.

Good next adapters:

- Statistical features: nflverse play-by-play and weekly player/team data
- Odds: additional public consensus sources for comparison and line history
- Injuries/inactives: a permitted official-team/NFL confirmation layer
- Experts: permitted API/CSV/manual import of public picks and verified results

Do not automate or redistribute authenticated sportsbook, Action Network,
ESPN subscriber, or other paywalled content. The current ESPN+ layer stores only
brief attributed paraphrases captured during a user-authorized browser session;
it stores no credentials, cookies, or subscriber article text. Future updates
require another permissioned session or a permitted structured import.

## Run locally

Requirements: Node.js 22.13+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The schedule request falls back to the bundled,
clearly labeled demo slate when GitHub is offline.

Verify the project:

```bash
pnpm test
pnpm run build
```

Generate a D1 migration after changing `db/schema.ts`:

```bash
pnpm run db:generate
```

## Extend the vertical slice

1. Implement the relevant interface in `lib/nfl/adapters/source-adapter.ts`.
2. Normalize source-specific names, markets, times, probabilities, and line
   formats inside the adapter.
3. Add the new layer to the service orchestration; keep provider logic out of
   `scoring.ts`.
4. Persist the exact source values used for every recommendation in
   `evidence_snapshots`.
5. Settle results and closing prices in `recommendation_results`.
6. Evaluate performance by model version, evidence combination, market, prop
   type, grade, and confidence band before changing weights.

The first production modeling upgrade should be a reproducible nflverse feature
job for EPA/play, success rate, pace, pressure, explosive plays, and player
opportunity. The first production operations upgrade should be scheduled odds
snapshots so opening/current/closing lines and CLV are based on captured data,
not reconstructed later.
