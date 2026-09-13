import type { InjurySourceAdapter } from "./source-adapter";
import type { InjurySnapshot, SlateGame } from "../types";
import { fetchPublicJson } from "./public-fetch.ts";

export const SLEEPER_PLAYERS_URL = "https://api.sleeper.app/v1/players/nfl?active=true";
export const SLEEPER_DOCS_URL = "https://docs.sleeper.com/#players";

interface SleeperPlayer {
  player_id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  team?: string | null;
  position?: string | null;
  injury_status?: string | null;
  practice_participation?: string | null;
}

const SEVERITY: Record<string, number> = { IR: 0, Out: 1, Doubtful: 2, Questionable: 3, Probable: 4 };

export function injuriesFromSleeper(
  players: Record<string, SleeperPlayer>,
  teams: Set<string>,
  limitPerTeam = 4,
): InjurySnapshot[] {
  const injuries = Object.entries(players)
    .filter(([, player]) => player.team && teams.has(player.team) && player.injury_status?.trim())
    .map(([id, player]): InjurySnapshot => ({
      playerId: player.player_id || id,
      team: player.team as string,
      name: player.full_name || [player.first_name, player.last_name].filter(Boolean).join(" ") || "Unknown player",
      position: player.position || undefined,
      designation: player.injury_status as string,
      practiceParticipation: player.practice_participation || undefined,
    }))
    .sort((a, b) => (SEVERITY[a.designation] ?? 5) - (SEVERITY[b.designation] ?? 5) || a.name.localeCompare(b.name));

  const counts = new Map<string, number>();
  return injuries.filter((injury) => {
    const count = counts.get(injury.team) ?? 0;
    counts.set(injury.team, count + 1);
    return count < limitPerTeam;
  });
}

export class SleeperInjuryAdapter implements InjurySourceAdapter {
  readonly id = "sleeper-injuries";
  readonly name = "Sleeper";

  async loadInjuries(games: SlateGame[]): Promise<InjurySnapshot[]> {
    const teams = new Set(games.flatMap((game) => [game.awayTeam, game.homeTeam]));
    const players = await fetchPublicJson<Record<string, SleeperPlayer>>(SLEEPER_PLAYERS_URL, 86400);
    return injuriesFromSleeper(players, teams);
  }
}
