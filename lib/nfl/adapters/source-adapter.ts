import type { InjurySnapshot, ScheduleSourceResult, SlateGame, WeatherSnapshot } from "../types";

export interface ScheduleSourceAdapter {
  readonly id: string;
  readonly name: string;
  loadSundaySlate(now?: Date): Promise<ScheduleSourceResult>;
}

export interface ExpertSourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly supportedMarkets: readonly string[];
  loadPicks(): Promise<unknown[]>;
}

export interface MarketSourceAdapter {
  readonly id: string;
  readonly name: string;
  loadMarkets(): Promise<unknown[]>;
}

export interface ContextSourceAdapter {
  readonly id: string;
  readonly name: string;
  loadWeather(games: SlateGame[]): Promise<WeatherSnapshot[]>;
}

export interface InjurySourceAdapter {
  readonly id: string;
  readonly name: string;
  loadInjuries(games: SlateGame[]): Promise<InjurySnapshot[]>;
}
