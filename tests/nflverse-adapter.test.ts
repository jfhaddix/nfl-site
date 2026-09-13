import assert from "node:assert/strict";
import test from "node:test";
import { eligibleGamesFromCsv, parseCsv } from "../lib/nfl/adapters/nflverse-schedule.ts";

const header = "game_id,season,game_type,week,gameday,weekday,gametime,away_team,away_score,home_team,home_score,spread_line,away_spread_odds,home_spread_odds,total_line,under_odds,over_odds,away_moneyline,home_moneyline,roof,temp,wind,stadium";
const csv = [
  header,
  "sun-early,2026,REG,1,2026-09-13,Sunday,13:00,ATL,,PIT,,6,-110,-110,41.5,-105,-115,220,-270,outdoors,65,8,Acrisure Stadium",
  "sun-late-a,2026,REG,1,2026-09-13,Sunday,16:05,LAC,,LV,,-2.5,-108,-112,46,-110,-110,-135,114,dome,,,Allegiant Stadium",
  "sun-late-b,2026,REG,1,2026-09-13,Sunday,16:25,DAL,,NYG,,-1,-105,-115,44,-115,-105,-118,-102,outdoors,70,5,\"MetLife, East Rutherford\"",
  "sun-morning,2026,REG,1,2026-09-13,Sunday,09:30,JAX,,MIA,,1,-110,-110,42,-110,-110,102,-122,outdoors,72,3,Wembley",
  "sun-night,2026,REG,1,2026-09-13,Sunday,20:20,GB,,CHI,,-3,-110,-110,45,-110,-110,-155,130,outdoors,60,12,Soldier Field",
  "monday,2026,REG,1,2026-09-14,Monday,20:15,BUF,,NYJ,,-4,-110,-110,47,-110,-110,-205,170,outdoors,55,10,MetLife Stadium",
].join("\n");

test("CSV parser keeps quoted commas inside a field", () => {
  const rows = parseCsv(csv);
  assert.equal(rows[3].at(-1), "MetLife, East Rutherford");
});

test("adapter includes only Sunday 1:00, 4:05, and 4:25 PM games", () => {
  const result = eligibleGamesFromCsv(csv, new Date("2026-09-12T12:00:00Z"));
  assert.equal(result.slateDate, "2026-09-13");
  assert.deepEqual(result.games.map((game) => game.id), ["sun-early", "sun-late-a", "sun-late-b"]);
  assert.deepEqual(result.games.map((game) => game.time), ["1:00 PM", "4:05 PM", "4:25 PM"]);
  assert.deepEqual(
    { awayMoneyline: result.games[0].awayMoneyline, homeMoneyline: result.games[0].homeMoneyline, overOdds: result.games[0].overOdds },
    { awayMoneyline: 220, homeMoneyline: -270, overOdds: -115 },
  );
});
