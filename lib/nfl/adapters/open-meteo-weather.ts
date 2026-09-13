import type { ContextSourceAdapter } from "./source-adapter";
import type { SlateGame, WeatherSnapshot } from "../types";
import { fetchPublicJson } from "./public-fetch.ts";

export const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
export const OPEN_METEO_DOCS_URL = "https://open-meteo.com/en/docs";

const STADIUM_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  ARI: { latitude: 33.5276, longitude: -112.2626 },
  ATL: { latitude: 33.7554, longitude: -84.4008 },
  BAL: { latitude: 39.278, longitude: -76.6227 },
  BUF: { latitude: 42.7738, longitude: -78.7868 },
  CAR: { latitude: 35.2258, longitude: -80.8528 },
  CHI: { latitude: 41.8623, longitude: -87.6167 },
  CIN: { latitude: 39.0954, longitude: -84.516 },
  CLE: { latitude: 41.5061, longitude: -81.6995 },
  DAL: { latitude: 32.7473, longitude: -97.0945 },
  DEN: { latitude: 39.7439, longitude: -105.0201 },
  DET: { latitude: 42.34, longitude: -83.0456 },
  GB: { latitude: 44.5013, longitude: -88.0622 },
  HOU: { latitude: 29.6847, longitude: -95.4107 },
  IND: { latitude: 39.7601, longitude: -86.1639 },
  JAX: { latitude: 30.3239, longitude: -81.6373 },
  KC: { latitude: 39.0489, longitude: -94.4839 },
  LA: { latitude: 33.9535, longitude: -118.339 },
  LAC: { latitude: 33.9535, longitude: -118.339 },
  LV: { latitude: 36.0908, longitude: -115.183 },
  MIA: { latitude: 25.958, longitude: -80.2389 },
  MIN: { latitude: 44.9738, longitude: -93.2581 },
  NE: { latitude: 42.0909, longitude: -71.2643 },
  NO: { latitude: 29.9511, longitude: -90.0812 },
  NYG: { latitude: 40.8135, longitude: -74.0745 },
  NYJ: { latitude: 40.8135, longitude: -74.0745 },
  PHI: { latitude: 39.9008, longitude: -75.1675 },
  PIT: { latitude: 40.4468, longitude: -80.0158 },
  SEA: { latitude: 47.5952, longitude: -122.3316 },
  SF: { latitude: 37.403, longitude: -121.97 },
  TB: { latitude: 27.9759, longitude: -82.5033 },
  TEN: { latitude: 36.1665, longitude: -86.7713 },
  WAS: { latitude: 38.9078, longitude: -76.8645 },
};

const RETRACTABLE_ROOF_TEAMS = new Set(["ARI", "ATL", "DAL", "HOU", "IND"]);

interface OpenMeteoResponse {
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    wind_speed_10m?: number[];
  };
}

function kickoffHour(game: SlateGame) {
  return game.time.startsWith("1:") ? "13:00" : "16:00";
}

function isIndoor(game: SlateGame) {
  return game.roof === "dome" || game.roof === "closed";
}

export function weatherFromOpenMeteo(game: SlateGame, data: OpenMeteoResponse): WeatherSnapshot {
  if (isIndoor(game)) return { gameId: game.id, status: "indoor", summary: "Indoor venue · weather neutral" };

  const target = `${game.date}T${kickoffHour(game)}`;
  const index = data.hourly?.time?.indexOf(target) ?? -1;
  const temperatureF = data.hourly?.temperature_2m?.[index];
  const windMph = data.hourly?.wind_speed_10m?.[index];
  const precipitationProbability = data.hourly?.precipitation_probability?.[index];

  if (index < 0 || temperatureF === undefined || windMph === undefined) {
    return { gameId: game.id, status: "unavailable", summary: "Kickoff forecast unavailable" };
  }

  return {
    gameId: game.id,
    status: "live",
    temperatureF: Math.round(temperatureF),
    windMph: Math.round(windMph),
    precipitationProbability: precipitationProbability === undefined ? undefined : Math.round(precipitationProbability),
    summary: `${RETRACTABLE_ROOF_TEAMS.has(game.homeTeam) ? "Roof status pending · " : ""}${Math.round(temperatureF)}°F · ${Math.round(windMph)} mph wind${precipitationProbability === undefined ? "" : ` · ${Math.round(precipitationProbability)}% precip.`}`,
  };
}

export class OpenMeteoWeatherAdapter implements ContextSourceAdapter {
  readonly id = "open-meteo-weather";
  readonly name = "Open-Meteo";

  async loadWeather(games: SlateGame[]): Promise<WeatherSnapshot[]> {
    const snapshots = new Map<string, WeatherSnapshot>();
    const outdoor = games.filter((game) => {
      if (isIndoor(game)) {
        snapshots.set(game.id, weatherFromOpenMeteo(game, {}));
        return false;
      }
      if (!STADIUM_COORDINATES[game.homeTeam]) {
        snapshots.set(game.id, { gameId: game.id, status: "unavailable", summary: "Venue coordinates unavailable" });
        return false;
      }
      return true;
    });

    if (outdoor.length) {
      const params = new URLSearchParams({
        latitude: outdoor.map((game) => STADIUM_COORDINATES[game.homeTeam].latitude).join(","),
        longitude: outdoor.map((game) => STADIUM_COORDINATES[game.homeTeam].longitude).join(","),
        hourly: "temperature_2m,precipitation_probability,wind_speed_10m",
        temperature_unit: "fahrenheit",
        wind_speed_unit: "mph",
        timezone: "America/New_York",
        start_date: outdoor[0].date,
        end_date: outdoor[0].date,
      });

      try {
        const data = await fetchPublicJson<OpenMeteoResponse | OpenMeteoResponse[]>(`${OPEN_METEO_URL}?${params}`, 1800);
        const forecasts = Array.isArray(data) ? data : [data];
        outdoor.forEach((game, index) => snapshots.set(game.id, weatherFromOpenMeteo(game, forecasts[index] ?? {})));
      } catch {
        outdoor.forEach((game) => snapshots.set(game.id, { gameId: game.id, status: "unavailable", summary: "Weather feed temporarily unavailable" }));
      }
    }

    return games.map((game) => snapshots.get(game.id) ?? { gameId: game.id, status: "unavailable", summary: "Weather unavailable" });
  }
}
