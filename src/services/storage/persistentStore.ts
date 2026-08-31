import type { BrandingSettings } from '../../types/branding';
import { DEFAULT_BRANDING } from '../../types/branding';
import type { Raffle } from '../../types/raffle';
import { createDemoRaffle } from '../mock/mockRaffleData';
import { getGitHubStorageConfig, isGitHubStorageConfigured } from './githubConfig';
import {
  GitHubConflictError,
  readGitHubAppState,
  writeGitHubAppStateWithRetry,
} from './githubStore';

const STORAGE_KEY = 'career-raffle-machine:v1';
const GITHUB_POLL_MS = 8000;
export const STORAGE_UPDATED_EVENT = 'career-raffle-storage-updated';
export const STORAGE_SYNC_STATUS_EVENT = 'career-raffle-sync-status';

export interface PersistedAppState {
  version: 1;
  raffles: Record<string, Raffle>;
  order: string[];
  branding: BrandingSettings;
}

export interface PersistSyncStatus {
  mode: 'github' | 'local';
  syncing: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
}

let cachedState: PersistedAppState | null = null;
let githubSha: string | null = null;
let initialized = false;
let initPromise: Promise<void> | null = null;
let githubWriteChain: Promise<void> = Promise.resolve();
let syncStatus: PersistSyncStatus = {
  mode: isGitHubStorageConfigured() ? 'github' : 'local',
  syncing: false,
  lastSyncedAt: null,
  lastError: null,
};

function createDefaultState(): PersistedAppState {
  const demo = createDemoRaffle();
  return {
    version: 1,
    raffles: { [demo.id]: demo },
    order: [demo.id],
    branding: { ...DEFAULT_BRANDING },
  };
}

export function isPersistedAppState(value: unknown): value is PersistedAppState {
  if (!value || typeof value !== 'object') return false;
  const state = value as PersistedAppState;
  return state.version === 1 && typeof state.raffles === 'object' && Array.isArray(state.order);
}

function readLocalState(): PersistedAppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPersistedAppState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeLocalState(state: PersistedAppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setSyncStatus(patch: Partial<PersistSyncStatus>): void {
  syncStatus = { ...syncStatus, ...patch };
  window.dispatchEvent(new CustomEvent(STORAGE_SYNC_STATUS_EVENT));
}

export function getPersistSyncStatus(): PersistSyncStatus {
  return { ...syncStatus };
}

function notifyStorageUpdated(): void {
  window.dispatchEvent(new CustomEvent(STORAGE_UPDATED_EVENT));
}

async function persistToGitHub(state: PersistedAppState): Promise<void> {
  const config = getGitHubStorageConfig();
  if (!config) return;

  setSyncStatus({ syncing: true, lastError: null });

  try {
    githubSha = await writeGitHubAppStateWithRetry(config, state, githubSha);
    setSyncStatus({
      syncing: false,
      lastSyncedAt: new Date().toISOString(),
      lastError: null,
    });
  } catch (error) {
    const message =
      error instanceof GitHubConflictError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Could not save to GitHub.';
    setSyncStatus({ syncing: false, lastError: message });
    throw error;
  }
}

function queueGitHubPersist(state: PersistedAppState): Promise<void> {
  const config = getGitHubStorageConfig();
  if (!config) return Promise.resolve();

  const job = githubWriteChain.then(() => persistToGitHub(state));
  githubWriteChain = job.catch(() => {
    // Keep the queue alive after a failed write.
  });
  return job;
}

export async function initPersistedStore(): Promise<void> {
  if (initialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      const config = getGitHubStorageConfig();

      if (config) {
        setSyncStatus({ mode: 'github', syncing: true, lastError: null });
        try {
          const remote = await readGitHubAppState(config);
          if (remote) {
            cachedState = remote.state;
            githubSha = remote.sha;
          } else {
            const local = readLocalState();
            cachedState = local ?? createDefaultState();
            githubSha = await writeGitHubAppStateWithRetry(config, cachedState, null);
          }
          writeLocalState(cachedState);
          setSyncStatus({
            syncing: false,
            lastSyncedAt: new Date().toISOString(),
            lastError: null,
          });
        } catch (error) {
          const local = readLocalState();
          cachedState = local ?? createDefaultState();
          writeLocalState(cachedState);
          setSyncStatus({
            syncing: false,
            lastError:
              error instanceof Error ? error.message : 'Could not load data from GitHub.',
          });
        }
      } else {
        cachedState = readLocalState() ?? createDefaultState();
        writeLocalState(cachedState);
        setSyncStatus({ mode: 'local', syncing: false, lastError: null });
      }

      initialized = true;
      notifyStorageUpdated();
    })();
  }

  await initPromise;
}

export async function refreshPersistedStateFromGitHub(): Promise<boolean> {
  const config = getGitHubStorageConfig();
  if (!config) return false;

  try {
    const remote = await readGitHubAppState(config);
    if (!remote) return false;

    const changed =
      githubSha !== remote.sha ||
      JSON.stringify(cachedState) !== JSON.stringify(remote.state);

    if (changed) {
      cachedState = remote.state;
      githubSha = remote.sha;
      writeLocalState(remote.state);
      setSyncStatus({
        lastSyncedAt: new Date().toISOString(),
        lastError: null,
      });
      notifyStorageUpdated();
    }

    return changed;
  } catch (error) {
    setSyncStatus({
      lastError:
        error instanceof Error ? error.message : 'Could not refresh from GitHub.',
    });
    return false;
  }
}

export async function loadPersistedState(): Promise<PersistedAppState> {
  await initPersistedStore();
  return structuredClone(cachedState ?? createDefaultState());
}

export async function savePersistedState(state: PersistedAppState): Promise<void> {
  await initPersistedStore();
  cachedState = state;
  writeLocalState(state);
  notifyStorageUpdated();
  queueGitHubPersist(state);
  await githubWriteChain;
}

export async function exportPersistedStateJson(): Promise<string> {
  const state = await loadPersistedState();
  return JSON.stringify(state, null, 2);
}

export async function importPersistedStateJson(json: string): Promise<void> {
  const parsed: unknown = JSON.parse(json);
  if (!isPersistedAppState(parsed)) {
    throw new Error('Invalid backup file format.');
  }
  await savePersistedState(parsed);
}

export function subscribeToStorageUpdates(listener: () => void): () => void {
  const onCustom = () => listener();
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  const onSyncStatus = () => listener();

  window.addEventListener(STORAGE_UPDATED_EVENT, onCustom);
  window.addEventListener(STORAGE_SYNC_STATUS_EVENT, onSyncStatus);
  window.addEventListener('storage', onStorage);

  let pollId: number | null = null;
  if (isGitHubStorageConfigured()) {
    pollId = window.setInterval(() => {
      refreshPersistedStateFromGitHub().catch(() => {
        // Sync status already updated.
      });
    }, GITHUB_POLL_MS);
  }

  return () => {
    window.removeEventListener(STORAGE_UPDATED_EVENT, onCustom);
    window.removeEventListener(STORAGE_SYNC_STATUS_EVENT, onSyncStatus);
    window.removeEventListener('storage', onStorage);
    if (pollId !== null) window.clearInterval(pollId);
  };
}

export function subscribeToSyncStatus(listener: () => void): () => void {
  const onSyncStatus = () => listener();
  window.addEventListener(STORAGE_SYNC_STATUS_EVENT, onSyncStatus);
  return () => window.removeEventListener(STORAGE_SYNC_STATUS_EVENT, onSyncStatus);
}
