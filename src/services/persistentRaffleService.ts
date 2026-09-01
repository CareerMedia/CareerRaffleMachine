import type { BrandingSettings } from '../types/branding';
import { DEFAULT_BRANDING } from '../types/branding';
import type { DrawResult, Raffle, RaffleStats } from '../types/raffle';
import {
  createParticipants,
  parseParticipantNames,
  syncRaffleDerivedFields,
} from './mock/mockRaffleData';
import type {
  CreateRaffleInput,
  RaffleService,
  UpdateRaffleInput,
} from './raffleService';
import {
  exportPersistedStateJson,
  importPersistedStateJson,
  loadPersistedState,
  savePersistedState,
} from './storage/persistentStore';
import { sanitizeRaffleForDisplay } from './storage/mergeAppState';

function getEligibleParticipants(raffle: Raffle) {
  return raffle.participants.filter((p) => p.eligible);
}

function generateRaffleId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  return slug ? `${slug}-${suffix}` : `raffle-${suffix}`;
}

async function mutateRaffle(
  raffleId: string,
  mutator: (raffle: Raffle) => Raffle,
): Promise<Raffle> {
  const state = await loadPersistedState();
  const existing = state.raffles[raffleId];
  if (!existing) throw new Error('Raffle not found');

  const updated = sanitizeRaffleForDisplay(
    syncRaffleDerivedFields(mutator(structuredClone(existing))),
  );
  state.raffles[raffleId] = updated;
  await savePersistedState(state);
  return structuredClone(updated);
}

export class PersistentRaffleService implements RaffleService {
  async getRaffle(id: string): Promise<Raffle | null> {
    const state = await loadPersistedState();
    const raffle = state.raffles[id];
    if (!raffle) return null;
    return structuredClone(sanitizeRaffleForDisplay(raffle));
  }

  async getActiveRaffle(): Promise<Raffle | null> {
    const raffles = await this.listRaffles();
    return raffles.find((r) => r.status === 'active') ?? raffles[0] ?? null;
  }

  async listRaffles(): Promise<Raffle[]> {
    const state = await loadPersistedState();
    return state.order
      .map((id) => state.raffles[id])
      .filter((raffle): raffle is Raffle => Boolean(raffle))
      .map((raffle) => structuredClone(sanitizeRaffleForDisplay(raffle)));
  }

  async createRaffle(input: CreateRaffleInput): Promise<Raffle> {
    const state = await loadPersistedState();
    const id = generateRaffleId(input.title.trim() || 'New Raffle');
    const raffle = syncRaffleDerivedFields({
      id,
      title: input.title.trim() || 'New Raffle',
      totalParticipants: 0,
      prizeCount: Math.max(1, input.prizeCount ?? 1),
      currentDraw: 1,
      status: input.status ?? 'draft',
      participants: [],
      winners: [],
    });

    state.raffles[id] = raffle;
    state.order.unshift(id);
    await savePersistedState(state);
    return structuredClone(raffle);
  }

  async updateRaffle(id: string, input: UpdateRaffleInput): Promise<Raffle> {
    return mutateRaffle(id, (raffle) => {
      if (input.title !== undefined) {
        raffle.title = input.title.trim() || raffle.title;
      }
      if (input.status !== undefined) {
        raffle.status = input.status;
      }
      if (input.prizeCount !== undefined) {
        raffle.prizeCount = Math.max(1, Math.floor(input.prizeCount));
      }
      if (input.participantsText !== undefined) {
        const names = parseParticipantNames(input.participantsText);
        const ineligible = raffle.participants.filter((p) => !p.eligible);
        const newEligible = createParticipants(names).map((p, i) => ({
          ...p,
          id: `participant-${Date.now()}-${i}`,
        }));
        raffle.participants = [...ineligible, ...newEligible];
      }
      return raffle;
    });
  }

  async deleteRaffle(id: string): Promise<void> {
    const state = await loadPersistedState();
    if (!state.raffles[id]) throw new Error('Raffle not found');

    delete state.raffles[id];
    state.order = state.order.filter((raffleId) => raffleId !== id);

    if (state.order.length === 0) {
      const fallback = syncRaffleDerivedFields({
        id: generateRaffleId('New Raffle'),
        title: 'New Raffle',
        totalParticipants: 0,
        prizeCount: 1,
        currentDraw: 1,
        status: 'draft',
        participants: [],
        winners: [],
      });
      state.raffles[fallback.id] = fallback;
      state.order = [fallback.id];
    }

    await savePersistedState(state);
  }

  async getStats(raffleId: string): Promise<RaffleStats> {
    const raffle = await this.getRaffle(raffleId);
    if (!raffle) throw new Error('Raffle not found');

    const eligible = getEligibleParticipants(raffle);
    const prizesRemaining = Math.max(0, raffle.prizeCount - raffle.winners.length);

    return {
      inTheRunning: eligible.length,
      prizesRemaining,
      currentDraw: raffle.winners.length + 1,
      totalPrizes: raffle.prizeCount,
    };
  }

  async drawWinner(raffleId: string): Promise<DrawResult> {
    const raffle = await this.getRaffle(raffleId);
    if (!raffle) throw new Error('Raffle not found');

    const eligible = getEligibleParticipants(raffle);
    if (eligible.length === 0) throw new Error('No eligible participants');

    const segmentIndex = Math.floor(Math.random() * eligible.length);
    const winner = eligible[segmentIndex];

    return {
      winner,
      drawNumber: raffle.winners.length + 1,
      segmentIndex,
    };
  }

  async removeWinnerFromPool(raffleId: string, participantId: string): Promise<void> {
    await mutateRaffle(raffleId, (raffle) => {
      const participant = raffle.participants.find((p) => p.id === participantId);
      if (participant) participant.eligible = false;

      const winnerName = participant?.name ?? 'Unknown';
      raffle.winners.push({
        id: `winner-${raffle.winners.length + 1}-${Date.now()}`,
        participantId,
        participantName: winnerName,
        drawNumber: raffle.winners.length + 1,
        wonAt: new Date().toISOString(),
      });

      return raffle;
    });
  }

  async updatePrizeCount(raffleId: string, prizeCount: number): Promise<void> {
    await this.updateRaffle(raffleId, { prizeCount });
  }

  async updateParticipants(raffleId: string, namesText: string): Promise<void> {
    await this.updateRaffle(raffleId, { participantsText: namesText });
  }

  async getBranding(): Promise<BrandingSettings> {
    const state = await loadPersistedState();
    return { ...(state.branding ?? DEFAULT_BRANDING) };
  }

  async updateBranding(branding: Partial<BrandingSettings>): Promise<BrandingSettings> {
    const state = await loadPersistedState();
    state.branding = {
      ...(state.branding ?? DEFAULT_BRANDING),
      ...branding,
    };
    await savePersistedState(state);
    return { ...state.branding };
  }

  async exportData(): Promise<string> {
    return exportPersistedStateJson();
  }

  async importData(json: string): Promise<void> {
    await importPersistedStateJson(json);
  }
}
