import type { ScheduleSourceAdapter } from "./source-adapter";
import type { ScheduleSourceResult, SlateGame } from "../types";

export const NFLVERSE_GAMES_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv";

const ELIGIBLE_TIMES = new Set(["13:00", "16:05", "16:25"]);

export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function formatTime(time: string): "1:00 PM" | "4:05 PM" | "4:25 PM" {
  if (time === "16:05") return "4:05 PM";
  if (time === "16:25") return "4:25 PM";
  return "1:00 PM";
}

function asNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

export function eligibleGamesFromCsv(csv: string, now = new Date()): {
  games: SlateGame[];
  slateDate?: string;
  status: "live" | "latest-available";
} {
  const [columns, ...rawRows] = parseCsv(csv);
  const index = new Map(columns.map((column, position) => [column, position]));
  const value = (row: string[], column: string) => row[index.get(column) ?? -1] ?? "";

  const eligibleRows = rawRows.filter((row) =>
    value(row, "game_type") === "REG"
    && value(row, "weekday") === "Sunday"
    && ELIGIBLE_TIMES.has(value(row, "gametime")),
  );
  const dates = [...new Set(eligibleRows.map((row) => value(row, "gameday")))].sort();
  const today = now.toISOString().slice(0, 10);
  const nextDate = dates.find((date) => date >= today);
  const slateDate = nextDate ?? dates.at(-1);
  const status = nextDate ? "live" : "latest-available";

  const games = eligibleRows
    .filter((row) => value(row, "gameday") === slateDate)
    .map((row): SlateGame => {
      const time = value(row, "gametime");
      return {
        id: value(row, "game_id"),
        season: Number(value(row, "season")),
        week: Number(value(row, "week")),
        date: value(row, "gameday"),
        time: formatTime(time),
        timeWindow: time === "13:00" ? "1 PM" : "4 PM",
        awayTeam: value(row, "away_team"),
        homeTeam: value(row, "home_team"),
        venue: value(row, "stadium") || undefined,
        roof: value(row, "roof") || undefined,
        temperature: asNumber(value(row, "temp")),
        windMph: asNumber(value(row, "wind")),
        spread: asNumber(value(row, "spread_line")),
        awaySpreadOdds: asNumber(value(row, "away_spread_odds")),
        homeSpreadOdds: asNumber(value(row, "home_spread_odds")),
        total: asNumber(value(row, "total_line")),
        overOdds: asNumber(value(row, "over_odds")),
        underOdds: asNumber(value(row, "under_odds")),
        awayMoneyline: asNumber(value(row, "away_moneyline")),
        homeMoneyline: asNumber(value(row, "home_moneyline")),
        status: value(row, "away_score") && value(row, "home_score") ? "final" : "scheduled",
        source: "nflverse",
      };
    })
    .sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));

  return { games, slateDate, status };
}

export class NflverseScheduleAdapter implements ScheduleSourceAdapter {
  readonly id = "nflverse-schedules";
  readonly name = "nflverse schedules";

  async loadSundaySlate(now = new Date()): Promise<ScheduleSourceResult> {
    const response = await fetch(NFLVERSE_GAMES_URL, {
      headers: { Accept: "text/csv" },
    });
    if (!response.ok) throw new Error(`nflverse returned HTTP ${response.status}`);

    const parsed = eligibleGamesFromCsv(await response.text(), now);
    if (!parsed.games.length) throw new Error("nflverse returned no eligible Sunday daytime games.");

    return {
      ...parsed,
      source: this.name,
      sourceUrl: NFLVERSE_GAMES_URL,
      asOf: new Date().toISOString(),
      note: parsed.status === "live"
        ? "Schedule and public consensus odds loaded from nflverse; demo recommendations remain separate."
        : "No future slate was available, so the most recent eligible slate is shown.",
    };
  }
}
