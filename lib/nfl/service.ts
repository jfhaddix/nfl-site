import { demoGames } from "./demo-data";
import { NflverseScheduleAdapter, NFLVERSE_GAMES_URL } from "./adapters/nflverse-schedule";
import { OpenMeteoWeatherAdapter, OPEN_METEO_DOCS_URL } from "./adapters/open-meteo-weather";
import { SleeperInjuryAdapter, SLEEPER_DOCS_URL } from "./adapters/sleeper-injuries";
import type { PublicContextResult, PublicFeedStatus, ScheduleSourceResult, SlateGame } from "./types";

function weatherFeedStatus(weather: PublicContextResult["weather"]): PublicFeedStatus["status"] {
  const outdoor = weather.filter((item) => item.status !== "indoor");
  if (!outdoor.length || outdoor.every((item) => item.status === "live")) return "live";
  if (outdoor.some((item) => item.status === "live")) return "partial";
  return "unavailable";
}

async function loadPublicContext(games: SlateGame[], asOf: string): Promise<PublicContextResult> {
  const weatherAdapter = new OpenMeteoWeatherAdapter();
  const injuryAdapter = new SleeperInjuryAdapter();
  const [weather, injuryResult] = await Promise.all([
    weatherAdapter.loadWeather(games),
    injuryAdapter.loadInjuries(games).then((injuries) => ({ injuries, available: true })).catch(() => ({ injuries: [], available: false })),
  ]);
  const oddsAvailable = games.some((game) => game.spread !== undefined || game.total !== undefined || game.homeMoneyline !== undefined);

  return {
    weather,
    injuries: injuryResult.injuries,
    feeds: [
      {
        id: "odds",
        name: "nflverse consensus odds",
        sourceUrl: NFLVERSE_GAMES_URL,
        status: oddsAvailable ? "live" : "unavailable",
        asOf,
        note: oddsAvailable ? "Spread, moneyline, total, and market prices · no account" : "No market lines are posted yet",
      },
      {
        id: "weather",
        name: weatherAdapter.name,
        sourceUrl: OPEN_METEO_DOCS_URL,
        status: weatherFeedStatus(weather),
        asOf,
        note: "Kickoff temperature, wind, and precipitation · no API key",
      },
      {
        id: "injuries",
        name: injuryAdapter.name,
        sourceUrl: SLEEPER_DOCS_URL,
        status: injuryResult.available ? "live" : "unavailable",
        asOf,
        note: injuryResult.available ? "Current player designations · read-only, no token" : "Injury feed temporarily unavailable",
      },
    ],
  };
}

export async function loadEligibleSundaySlate(now = new Date()): Promise<ScheduleSourceResult> {
  try {
    const schedule = await new NflverseScheduleAdapter().loadSundaySlate(now);
    return { ...schedule, context: await loadPublicContext(schedule.games, schedule.asOf) };
  } catch (error) {
    return {
      games: demoGames,
      source: "bundled demo snapshot",
      sourceUrl: NFLVERSE_GAMES_URL,
      asOf: new Date().toISOString(),
      slateDate: demoGames[0]?.date,
      status: "fallback",
      note: `Live schedule unavailable; showing the clearly labeled demo slate. ${error instanceof Error ? error.message : ""}`.trim(),
    };
  }
}
