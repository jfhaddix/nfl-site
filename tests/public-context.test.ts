import assert from "node:assert/strict";
import test from "node:test";
import { weatherFromOpenMeteo } from "../lib/nfl/adapters/open-meteo-weather.ts";
import { injuriesFromSleeper } from "../lib/nfl/adapters/sleeper-injuries.ts";
import type { SlateGame } from "../lib/nfl/types.ts";

const outdoorGame: SlateGame = {
  id: "2026_01_CHI_CAR",
  season: 2026,
  week: 1,
  date: "2026-09-13",
  time: "1:00 PM",
  timeWindow: "1 PM",
  awayTeam: "CHI",
  homeTeam: "CAR",
  roof: "outdoors",
  status: "scheduled",
  source: "test",
};

test("Open-Meteo response maps the nearest kickoff hour", () => {
  const weather = weatherFromOpenMeteo(outdoorGame, {
    hourly: {
      time: ["2026-09-13T12:00", "2026-09-13T13:00"],
      temperature_2m: [70.1, 72.6],
      precipitation_probability: [10, 22],
      wind_speed_10m: [4.2, 7.7],
    },
  });
  assert.equal(weather.status, "live");
  assert.equal(weather.temperatureF, 73);
  assert.equal(weather.windMph, 8);
  assert.equal(weather.precipitationProbability, 22);
});

test("indoor games do not make a weather request necessary", () => {
  const weather = weatherFromOpenMeteo({ ...outdoorGame, roof: "dome" }, {});
  assert.deepEqual(weather, { gameId: outdoorGame.id, status: "indoor", summary: "Indoor venue · weather neutral" });
});

test("Sleeper injuries are filtered to slate teams and ordered by severity", () => {
  const injuries = injuriesFromSleeper({
    one: { player_id: "one", full_name: "Carolina Out", team: "CAR", position: "WR", injury_status: "Out" },
    two: { player_id: "two", full_name: "Chicago Questionable", team: "CHI", position: "RB", injury_status: "Questionable" },
    three: { player_id: "three", full_name: "Other Team", team: "SEA", position: "QB", injury_status: "Out" },
    four: { player_id: "four", full_name: "Healthy Player", team: "CAR", position: "QB", injury_status: null },
  }, new Set(["CHI", "CAR"]));

  assert.deepEqual(injuries.map((item) => item.name), ["Carolina Out", "Chicago Questionable"]);
});
