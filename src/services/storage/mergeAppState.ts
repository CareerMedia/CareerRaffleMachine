import type { Participant, Raffle, Winner } from '../../types/raffle';
import { syncRaffleDerivedFields } from '../mock/mockRaffleData';
import type { PersistedAppState } from './persistentStore';

function mergeWinners(local: Winner[], remote: Winner[]): Winner[] {
  const byParticipant = new Map<string, Winner>();

  for (const winner of [...remote, ...local]) {
    const existing = byParticipant.get(winner.participantId);
    if (!existing || winner.drawNumber >= existing.drawNumber) {
      byParticipant.set(winner.participantId, winner);
    }
  }

  return [...byParticipant.values()].sort((a, b) => a.drawNumber - b.drawNumber);
}

function mergeParticipants(local: Participant[], remote: Participant[]): Participant[] {
  const byId = new Map<string, Participant>();

  for (const participant of remote) {
    byId.set(participant.id, { ...participant });
  }

  for (const participant of local) {
    const existing = byId.get(participant.id);
    if (!existing) {
      byId.set(participant.id, { ...participant });
      continue;
    }

    byId.set(participant.id, {
      ...existing,
      ...participant,
      name: participant.name.trim() ? participant.name : existing.name,
      // If either copy says ineligible, keep them off the wheel.
      eligible: existing.eligible && participant.eligible,
    });
  }

  return [...byId.values()];
}

function applyWinnerEligibility(raffle: Raffle): Raffle {
  const winnerIds = new Set(raffle.winners.map((winner) => winner.participantId));
  if (winnerIds.size === 0) return raffle;

  return {
    ...raffle,
    participants: raffle.participants.map((participant) =>
      winnerIds.has(participant.id) ? { ...participant, eligible: false } : participant,
    ),
  };
}

function mergeRaffle(local: Raffle, remote: Raffle): Raffle {
  const winners = mergeWinners(local.winners, remote.winners);
  const participants = mergeParticipants(local.participants, remote.participants);

  const merged = syncRaffleDerivedFields({
    ...local,
    title: local.title.trim() ? local.title : remote.title,
    prizeCount: Math.max(local.prizeCount, remote.prizeCount),
    status:
      local.status === 'active' || remote.status === 'active'
        ? 'active'
        : local.status === 'completed' || remote.status === 'completed'
          ? 'completed'
          : remote.status,
    participants,
    winners,
  });

  return syncRaffleDerivedFields(applyWinnerEligibility(merged));
}

export function mergeAppStates(
  local: PersistedAppState,
  remote: PersistedAppState,
): PersistedAppState {
  const raffleIds = new Set([
    ...local.order,
    ...remote.order,
    ...Object.keys(local.raffles),
    ...Object.keys(remote.raffles),
  ]);

  const raffles: Record<string, Raffle> = {};
  for (const id of raffleIds) {
    const localRaffle = local.raffles[id];
    const remoteRaffle = remote.raffles[id];
    if (localRaffle && remoteRaffle) {
      raffles[id] = mergeRaffle(localRaffle, remoteRaffle);
    } else if (localRaffle) {
      raffles[id] = syncRaffleDerivedFields(applyWinnerEligibility(localRaffle));
    } else if (remoteRaffle) {
      raffles[id] = syncRaffleDerivedFields(applyWinnerEligibility(remoteRaffle));
    }
  }

  const order: string[] = [];
  for (const id of local.order) {
    if (raffles[id] && !order.includes(id)) order.push(id);
  }
  for (const id of remote.order) {
    if (raffles[id] && !order.includes(id)) order.push(id);
  }
  for (const id of raffleIds) {
    if (raffles[id] && !order.includes(id)) order.push(id);
  }

  return {
    version: 1,
    revision: Math.max(local.revision ?? 0, remote.revision ?? 0),
    updatedAt:
      (local.updatedAt ?? '') >= (remote.updatedAt ?? '')
        ? local.updatedAt ?? remote.updatedAt
        : remote.updatedAt,
    raffles,
    order,
    branding: local.branding.logoDataUrl ? local.branding : remote.branding,
  };
}

/** Keep anyone who has already won off the wheel, even if stale sync data slips through. */
export function sanitizeRaffleForDisplay(raffle: Raffle): Raffle {
  return syncRaffleDerivedFields(applyWinnerEligibility(raffle));
}
