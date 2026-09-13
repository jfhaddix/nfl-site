"use client";

import { useEffect, useMemo, useState } from "react";
import { DEMO_WEEK, demoCandidates, demoGames } from "../lib/nfl/demo-data";
import { ESPN_WEEK_1_SOURCE, espnWeek1Insights } from "../lib/nfl/espn-insights";
import { scoreSlate } from "../lib/nfl/scoring";
import type { Grade, MarketType, PublicFeedStatus, ScheduleSourceResult, SlateGame, TimeWindow } from "../lib/nfl/types";

const recommendations = scoreSlate(demoCandidates);
const markets: Array<{ value: "ALL" | MarketType; label: string }> = [
  { value: "ALL", label: "All markets" },
  { value: "ATS", label: "ATS" },
  { value: "MONEYLINE", label: "Moneyline" },
  { value: "TOTAL", label: "Totals" },
  { value: "PROP", label: "Props" },
];
const grades: Array<"ALL" | Grade> = ["ALL", "A+", "A", "A-", "B+", "PASS"];

function percent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function marketLabel(market: MarketType) {
  return market === "MONEYLINE" ? "Moneyline" : market === "TOTAL" ? "Total" : market === "PROP" ? "Player prop" : "Spread";
}

function american(value?: number) {
  if (value === undefined) return "n/a";
  return value > 0 ? `+${value}` : String(value);
}

function spreadLabel(game: SlateGame) {
  if (game.spread === undefined) return "Not posted";
  if (game.spread === 0) return "Pick'em";
  const homeFavorite = game.spread > 0;
  const team = homeFavorite ? game.homeTeam : game.awayTeam;
  const price = homeFavorite ? game.homeSpreadOdds : game.awaySpreadOdds;
  return `${team} -${Math.abs(game.spread)}${price === undefined ? "" : ` (${american(price)})`}`;
}

const pendingFeeds: PublicFeedStatus[] = [
  { id: "odds", name: "nflverse consensus odds", sourceUrl: "https://github.com/nflverse/nfldata", status: "partial", asOf: "", note: "Loading spread, moneyline, total, and prices · no account" },
  { id: "weather", name: "Open-Meteo", sourceUrl: "https://open-meteo.com/en/docs", status: "partial", asOf: "", note: "Loading kickoff forecast · no API key" },
  { id: "injuries", name: "Sleeper", sourceUrl: "https://docs.sleeper.com/#players", status: "partial", asOf: "", note: "Loading player designations · read-only, no token" },
];

function Sparkline({ values, conflict = false }: { values: number[]; conflict?: boolean }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 92 + 4},${30 - ((value - min) / range) * 22}`).join(" ");
  return (
    <svg className="sparkline" viewBox="0 0 100 34" role="img" aria-label="Line movement">
      <polyline points={points} fill="none" stroke={conflict ? "#ef7255" : "#2c8a6e"} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <circle cx={points.split(" ").at(-1)?.split(",")[0]} cy={points.split(" ").at(-1)?.split(",")[1]} r="2.7" fill={conflict ? "#ef7255" : "#2c8a6e"} />
    </svg>
  );
}

function DirectionIcon({ direction }: { direction: "supports" | "neutral" | "conflicts" }) {
  return <span className={`direction ${direction}`} aria-hidden="true">{direction === "supports" ? "↑" : direction === "conflicts" ? "↓" : "—"}</span>;
}

export default function Home() {
  const [market, setMarket] = useState<"ALL" | MarketType>("ALL");
  const [window, setWindow] = useState<"ALL" | TimeWindow>("ALL");
  const [minimum, setMinimum] = useState(76);
  const [grade, setGrade] = useState<"ALL" | Grade>("ALL");
  const [selectedId, setSelectedId] = useState(recommendations[0].id);
  const [schedule, setSchedule] = useState<ScheduleSourceResult>({
    games: demoGames,
    source: "bundled demo snapshot",
    sourceUrl: "https://github.com/nflverse/nfldata",
    asOf: new Date().toISOString(),
    slateDate: DEMO_WEEK.date,
    status: "fallback",
    note: "Loading the current schedule adapter…",
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/slate", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Schedule request failed")))
      .then((result: ScheduleSourceResult) => setSchedule(result))
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") {
          setSchedule((current) => ({ ...current, note: "Current schedule could not be reached; the demo slate remains active." }));
        }
      });
    return () => controller.abort();
  }, []);

  const visible = useMemo(() => recommendations.filter((item) =>
    (market === "ALL" || item.market === market)
    && (window === "ALL" || item.timeWindow === window)
    && item.confidence >= minimum
    && (grade === "ALL" || item.grade === grade),
  ), [grade, market, minimum, window]);

  const selected = recommendations.find((item) => item.id === selectedId) ?? recommendations[0];
  const qualified = recommendations.filter((item) => item.qualifies);
  const averageEdge = qualified.reduce((sum, item) => sum + item.edge, 0) / qualified.length;
  const conflicts = recommendations.filter((item) => item.conflict).length;
  const scheduleWeek = schedule.games[0]?.week;
  const scheduleSeason = schedule.games[0]?.season;
  const publicFeeds = schedule.context?.feeds ?? pendingFeeds;
  const connectedFeeds = publicFeeds.filter((feed) => feed.status !== "unavailable").length;
  const publicFeedScore = schedule.context ? `${connectedFeeds}/3` : "—";

  return (
    <main className="app-shell">
      <aside className="side-rail">
        <a className="brand" href="#top" aria-label="Sunday Edge home"><span>SE</span></a>
        <nav aria-label="Primary navigation">
          <a className="nav-item active" href="#board"><span>01</span>Board</a>
          <a className="nav-item" href="#slate"><span>02</span>Slate</a>
          <a className="nav-item" href="#expert"><span>03</span>ESPN+</a>
          <a className="nav-item" href="#history"><span>04</span>History</a>
          <a className="nav-item" href="#sources"><span>05</span>Sources</a>
        </nav>
        <div className="rail-foot"><span className="live-dot" /> MODEL ONLINE</div>
      </aside>

      <section className="main-stage" id="top">
        <header className="topbar">
          <div><p className="kicker">NFL DECISION INTELLIGENCE</p><h1>Sunday Edge</h1></div>
          <div className="week-stamp">
            <span>{schedule.status === "live" ? "CURRENT SCHEDULE" : "VERTICAL SLICE"}</span>
            <strong>{scheduleSeason ? `${scheduleSeason} · Week ${scheduleWeek}` : DEMO_WEEK.label}</strong>
            <small>Sunday daytime only · Eastern Time</small>
          </div>
        </header>

        <div className="integrity-banner">
          <span className="banner-mark">i</span>
          <p><strong>No-login data:</strong> current consensus odds, kickoff weather, and player injury designations load from public read-only feeds. ESPN+ remains a separate, permissioned manual research snapshot and never supplies credentials to the app.</p>
          <span className={`source-status ${schedule.status}`}><i /> {schedule.status === "live" ? `${connectedFeeds}/3 PUBLIC FEEDS` : "DEMO MODE"}</span>
        </div>

        <section className="control-deck" aria-label="Board filters">
          <div className="filter-group">
            <span className="filter-label">WINDOW</span>
            {(["ALL", "1 PM", "4 PM"] as const).map((value) => <button key={value} className={`chip ${window === value ? "selected" : ""}`} onClick={() => setWindow(value)}>{value === "ALL" ? "All Sunday" : value}</button>)}
          </div>
          <div className="filter-group markets">
            <span className="filter-label">MARKET</span>
            {markets.map((item) => <button key={item.value} className={`chip ${market === item.value ? "selected" : ""}`} onClick={() => setMarket(item.value)}>{item.label}</button>)}
          </div>
          <div className="filter-group compact">
            <label className="filter-label" htmlFor="minimum">CONFIDENCE</label>
            <select id="minimum" value={minimum} onChange={(event) => setMinimum(Number(event.target.value))}>
              <option value={0}>Any score</option>
              <option value={76}>76+</option>
              <option value={82}>82+</option>
              <option value={87}>87+</option>
            </select>
          </div>
          <div className="filter-group compact">
            <label className="filter-label" htmlFor="grade">GRADE</label>
            <select id="grade" value={grade} onChange={(event) => setGrade(event.target.value as "ALL" | Grade)}>
              {grades.map((item) => <option key={item} value={item}>{item === "ALL" ? "All grades" : item}</option>)}
            </select>
          </div>
        </section>

        <section className="score-strip" aria-label="Slate summary">
          <div><span>Eligible games</span><strong>{schedule.games.length}</strong><small>1:00 · 4:05 · 4:25 ET</small></div>
          <div><span>Public feeds</span><strong>{publicFeedScore}</strong><small>No account or API key</small></div>
          <div><span>Qualified bets</span><strong>{qualified.length}</strong><small>{percent(averageEdge)} avg. demo edge</small></div>
          <div><span>ESPN+ signals</span><strong>{espnWeek1Insights.length}</strong><small>{conflicts} demo conflicts · context only</small></div>
          <div className="accent-metric"><span>Quality gate</span><strong>76+</strong><small>B+ or better</small></div>
        </section>

        <section className="category-grid" aria-label="Best bet by market">
          {(["ATS", "MONEYLINE", "TOTAL", "PROP"] as MarketType[]).map((type) => {
            const best = recommendations.find((item) => item.market === type && item.qualifies);
            return (
              <button key={type} className="category-card" onClick={() => best && setSelectedId(best.id)}>
                <span>{marketLabel(type)}</span>
                {best ? <><strong>{best.bet}</strong><small>{best.grade} · {best.confidence} confidence · {percent(best.edge)} edge</small></> : <><strong>PASS</strong><small>No bet clears the threshold</small></>}
              </button>
            );
          })}
        </section>

        <section className="board" id="board">
          <div className="section-heading">
            <div><span className="section-index">01</span><div><h2>Ranked opportunities</h2><p>{visible.length} match{visible.length === 1 ? "" : "es"} · click a row to inspect the evidence</p></div></div>
            <span className="board-rule">QUALITY, NOT QUANTITY</span>
          </div>
          <div className="analysis-grid">
            <div className="opportunity-list">
              <div className="table-head"><span>BET</span><span>PRICE / MOVE</span><span>EDGE</span><span>CONF.</span><span>GRADE</span></div>
              {visible.map((item, index) => (
                <button className={`opportunity ${selected.id === item.id ? "active" : ""} ${item.conflict ? "has-conflict" : ""}`} key={item.id} onClick={() => setSelectedId(item.id)}>
                  <span className="rank">{String(index + 1).padStart(2, "0")}</span>
                  <span className="game-cell"><small>{item.time} ET · {item.matchup} · {item.market}</small><strong>{item.bet}</strong><em>{item.conflict ? "Market conflict flagged" : item.explanation}</em></span>
                  <span className="market-cell"><strong>{item.currentLine}</strong><small>{item.openingLine} → {item.currentLine}</small></span>
                  <span className="signal-cell"><strong>{percent(item.edge)}</strong><small>{percent(item.estimatedProbability, 0)} model</small></span>
                  <span className="confidence-cell"><strong>{item.confidence}</strong><i><b style={{ width: `${item.confidence}%` }} /></i></span>
                  <span className={`grade ${item.grade === "PASS" ? "pass" : ""}`}>{item.grade}</span>
                </button>
              ))}
              {visible.length === 0 && <div className="empty-state"><strong>No forced action.</strong><span>No recommendations clear these filters. Passing is a valid position.</span></div>}
            </div>

            <aside className="evidence-panel" aria-label="Recommendation evidence">
              <div className="evidence-head">
                <div><span>{selected.matchup} · {selected.time} ET</span><h3>{selected.bet}</h3><p>{marketLabel(selected.market)} · {selected.currentLine} ({selected.americanOdds > 0 ? "+" : ""}{selected.americanOdds})</p></div>
                <span className={`large-grade ${selected.grade === "PASS" ? "pass" : ""}`}>{selected.grade}</span>
              </div>
              <div className="probability-block">
                <div><span>MODEL PROBABILITY</span><strong>{percent(selected.estimatedProbability)}</strong></div>
                <div><span>IMPLIED PROBABILITY</span><strong>{percent(selected.impliedProbability)}</strong></div>
                <div className="edge-number"><span>VALUE EDGE</span><strong>{percent(selected.edge)}</strong></div>
              </div>
              <div className="fair-line"><span>Fair line</span><strong>{selected.fairLine}</strong><span>Current</span><strong>{selected.currentLine}</strong></div>
              <div className="movement">
                <div><span>OPEN → CURRENT</span><strong>{selected.openingLine} → {selected.currentLine}</strong></div>
                <Sparkline values={selected.trend} conflict={selected.conflict} />
              </div>
              <div className="evidence-list">
                {selected.evidence.map((signal) => (
                  <div key={signal.layer}>
                    <DirectionIcon direction={signal.direction} />
                    <span><strong>{signal.label}</strong><small>{signal.summary}</small></span>
                    <em>{Math.round(signal.score * 100)}</em>
                  </div>
                ))}
              </div>
              {selected.conflict && <div className="conflict-note"><strong>Conflict retained</strong><span>The model still sees value, but market disagreement reduces confidence instead of being hidden.</span></div>}
              <div className="type-history">
                <div><span>SIMILAR SIGNALS</span><strong>{selected.historical.record}</strong><small>{selected.historical.sample} tracked demo decisions</small></div>
                <div><span>ROI</span><strong>{selected.historical.roi.toFixed(1)}%</strong><small>Avg. CLV {selected.historical.clv.toFixed(2)}</small></div>
              </div>
            </aside>
          </div>
        </section>

        <section className="slate-section" id="slate">
          <div className="section-heading">
            <div><span className="section-index">02</span><div><h2>Eligible Sunday slate</h2><p>{schedule.slateDate ?? "Date unavailable"} · excludes primetime and non-Sunday games</p></div></div>
            <a className="source-link" href={schedule.sourceUrl} target="_blank" rel="noreferrer">{schedule.source} ↗</a>
          </div>
          <div className="slate-grid">
            {schedule.games.map((game) => {
              const expertSignals = espnWeek1Insights.filter((item) => item.gameId === game.id);
              const weather = schedule.context?.weather.find((item) => item.gameId === game.id);
              const injuries = schedule.context?.injuries.filter((item) => item.team === game.awayTeam || item.team === game.homeTeam) ?? [];
              const injuryFeed = publicFeeds.find((feed) => feed.id === "injuries");
              return (
                <article key={game.id} className="game-card">
                  <div><span>{game.time} ET</span><em>{game.roof ?? "roof n/a"}</em></div>
                  <h3><span>{game.awayTeam}</span><small>at</small><span>{game.homeTeam}</span></h3>
                  <p>{game.venue ?? "Venue pending"}</p>
                  <div className="game-market">
                    <span><small>SPREAD</small><strong>{spreadLabel(game)}</strong></span>
                    <span><small>MONEYLINE</small><strong>{game.awayMoneyline === undefined && game.homeMoneyline === undefined ? "Not posted" : `${game.awayTeam} ${american(game.awayMoneyline)} · ${game.homeTeam} ${american(game.homeMoneyline)}`}</strong></span>
                    <span><small>TOTAL</small><strong>{game.total === undefined ? "Not posted" : `${game.total} · O ${american(game.overOdds)} / U ${american(game.underOdds)}`}</strong></span>
                  </div>
                  <div className="game-context">
                    <span><small>WEATHER</small><strong>{weather?.summary ?? "Loading public forecast…"}</strong></span>
                    <span><small>INJURIES</small><strong>{injuries.length ? `${injuries.length} shown · ${injuries.slice(0, 2).map((item) => `${item.name} (${item.designation})`).join(" · ")}` : injuryFeed?.status === "live" ? "No current designations returned" : "Loading public injury feed…"}</strong></span>
                  </div>
                  <div className={`game-decision ${expertSignals.length ? "research" : ""}`}><i />{expertSignals.length ? `${expertSignals.length} ESPN+ signal${expertSignals.length === 1 ? "" : "s"} · context only` : "No expert snapshot"}</div>
                </article>
              );
            })}
          </div>
          <p className="source-note">{schedule.note}</p>
        </section>

        <section className="expert-section" id="expert">
          <div className="section-heading">
            <div><span className="section-index">03</span><div><h2>ESPN+ expert research</h2><p>{ESPN_WEEK_1_SOURCE.publishedAt} snapshot · analyst context, kept separate from the demo model</p></div></div>
            <a className="source-link" href={ESPN_WEEK_1_SOURCE.url} target="_blank" rel="noreferrer">View source on ESPN+ ↗</a>
          </div>
          <div className="expert-guardrail">
            <span>CONTEXT ONLY</span>
            <p><strong>2026 tracked sample: 0.</strong> These attributed signals are visible for research, but cannot elevate a recommendation grade until their outcomes and closing-line value are tracked.</p>
            <em>{ESPN_WEEK_1_SOURCE.access}</em>
          </div>
          <div className="expert-table">
            <div className="expert-row heading"><span>GAME / ANALYST</span><span>MARKET</span><span>EXPERT SIGNAL</span><span>PRICE</span><span>DISTILLED RATIONALE</span></div>
            {espnWeek1Insights.map((insight) => (
              <article className="expert-row" key={insight.id}>
                <span className="expert-byline"><strong>{insight.matchup}</strong><small>{insight.analyst}</small></span>
                <span><b>{insight.market}</b></span>
                <strong>{insight.bet}</strong>
                <span className="expert-price">{insight.price}</span>
                <p>{insight.summary}</p>
              </article>
            ))}
          </div>
          <p className="source-note">Brief paraphrases captured from the user-authorized ESPN+ session. No login, cookie, or subscriber article text is stored by Sunday Edge.</p>
        </section>

        <section className="history-section" id="history">
          <div className="section-heading">
            <div><span className="section-index">04</span><div><h2>Historical signal performance</h2><p>Illustrative records show the reporting shape; D1 schema is ready for real tracked outcomes and CLV</p></div></div>
          </div>
          <div className="history-table">
            <div className="history-row heading"><span>RECOMMENDATION TYPE</span><span>RECORD</span><span>ROI</span><span>AVG. CLV</span><span>PERFORMANCE</span></div>
            {[
              ["Model + experts + market", "31–18–2", "11.8%", "+0.72", 78],
              ["Model + sharp market", "22–13–1", "9.6%", "+0.61", 66],
              ["Props · opportunity led", "28–19", "8.4%", "+0.38", 58],
              ["ATS · 82+ confidence", "18–12–1", "6.9%", "+0.44", 51],
            ].map((row) => <div className="history-row" key={row[0] as string}><strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span><span className="history-bar"><i style={{ width: `${row[4]}%` }} /></span></div>)}
          </div>
        </section>

        <section className="sources-section" id="sources">
          <div className="section-heading">
            <div><span className="section-index">05</span><div><h2>Modular evidence stack</h2><p>Each layer has an adapter contract and can be replaced independently</p></div></div>
          </div>
          <div className="source-grid">
            {publicFeeds.map((feed, index) => (
              <article key={feed.id}>
                <span>{String(index + 1).padStart(2, "0")} · {feed.id.toUpperCase()}</span>
                <h3><a href={feed.sourceUrl} target="_blank" rel="noreferrer">{feed.name} ↗</a></h3>
                <p>{feed.note}</p>
                <b className={feed.status !== "unavailable" ? "connected" : ""}><i /> {feed.status.toUpperCase()} · NO LOGIN</b>
              </article>
            ))}
            <article><span>04 · EXPERTS</span><h3>ESPN+ research</h3><p>Permissioned, manually distilled Week 1 analyst signals. Isolated from scoring until a tracked sample exists.</p><b className="connected"><i /> CONNECTED · MANUAL</b></article>
          </div>
        </section>

        <footer><span>FOR ANALYSIS ONLY · NOT A GUARANTEE · WAGER RESPONSIBLY</span><span>Sunday Edge · model v0.1-demo</span></footer>
      </section>
    </main>
  );
}
