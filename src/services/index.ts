import { isSupabaseConfigured } from './raffleService';
import { PersistentRaffleService } from './persistentRaffleService';
import type { RaffleService } from './raffleService';

let serviceInstance: RaffleService | null = null;

export function getRaffleService(): RaffleService {
  if (!serviceInstance) {
    if (isSupabaseConfigured()) {
      // Supabase implementation will be wired in a future phase.
      serviceInstance = new PersistentRaffleService();
    } else {
      serviceInstance = new PersistentRaffleService();
    }
  }
  return serviceInstance;
}
