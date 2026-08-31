import type { BrandingSettings } from '../types/branding';
import type { DrawResult, Raffle, RaffleStats } from '../types/raffle';

export interface CreateRaffleInput {
  title: string;
  prizeCount?: number;
  status?: Raffle['status'];
}

export interface UpdateRaffleInput {
  title?: string;
  status?: Raffle['status'];
  prizeCount?: number;
  participantsText?: string;
}

export interface RaffleService {
  getRaffle(id: string): Promise<Raffle | null>;
  getActiveRaffle(): Promise<Raffle | null>;
  listRaffles(): Promise<Raffle[]>;
  createRaffle(input: CreateRaffleInput): Promise<Raffle>;
  updateRaffle(id: string, input: UpdateRaffleInput): Promise<Raffle>;
  deleteRaffle(id: string): Promise<void>;
  getStats(raffleId: string): Promise<RaffleStats>;
  drawWinner(raffleId: string): Promise<DrawResult>;
  removeWinnerFromPool(raffleId: string, participantId: string): Promise<void>;
  updatePrizeCount(raffleId: string, prizeCount: number): Promise<void>;
  updateParticipants(raffleId: string, namesText: string): Promise<void>;
  getBranding(): Promise<BrandingSettings>;
  updateBranding(branding: Partial<BrandingSettings>): Promise<BrandingSettings>;
  exportData(): Promise<string>;
  importData(json: string): Promise<void>;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
