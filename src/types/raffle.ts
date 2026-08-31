export interface Participant {
  id: string;
  name: string;
  email?: string;
  eligible: boolean;
}

export interface Winner {
  id: string;
  participantId: string;
  participantName: string;
  drawNumber: number;
  wonAt: string;
}

export interface Raffle {
  id: string;
  title: string;
  totalParticipants: number;
  prizeCount: number;
  currentDraw: number;
  status: 'draft' | 'active' | 'completed';
  participants: Participant[];
  winners: Winner[];
}

export interface RaffleStats {
  inTheRunning: number;
  prizesRemaining: number;
  currentDraw: number;
  totalPrizes: number;
}

export interface DrawResult {
  winner: Participant;
  drawNumber: number;
  segmentIndex: number;
}
