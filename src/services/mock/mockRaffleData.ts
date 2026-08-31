import type { Participant, Raffle } from '../../types/raffle';

export const DEMO_PARTICIPANT_NAMES = [
  'Jordan Martinez',
  'Emily Parker',
  'Riley Johnson',
  'Dylan Brown',
  'Chloe Anderson',
  'Maya Patel',
  'Luis Hernandez',
  'Casey Nguyen',
  'Alex Garcia',
  'Taylor Williams',
  'Brandon Smith',
  'Samantha Lee',
] as const;

export function createParticipants(names: readonly string[]): Participant[] {
  return names.map((name, i) => ({
    id: `participant-${i + 1}`,
    name,
    eligible: true,
  }));
}

export function parseParticipantNames(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export const DEMO_RAFFLE_ID = 'demo-career-fair-giveaway';

export function createDemoRaffle(): Raffle {
  const participants = createParticipants(DEMO_PARTICIPANT_NAMES);

  return {
    id: DEMO_RAFFLE_ID,
    title: 'Career Fair Giveaway',
    totalParticipants: participants.length,
    prizeCount: 10,
    currentDraw: 1,
    status: 'active',
    participants,
    winners: [],
  };
}

export function syncRaffleDerivedFields(raffle: Raffle): Raffle {
  const eligible = raffle.participants.filter((p) => p.eligible);
  return {
    ...raffle,
    totalParticipants: eligible.length,
    currentDraw: raffle.winners.length + 1,
  };
}
