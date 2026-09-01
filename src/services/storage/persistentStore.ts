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
import { mergeAppStates } from './mergeAppState';

const STORAGE_KEY = 'career-raffle-machine:v1';
const GITHUB_POLL_MS = 2000;
export const STORAGE_UPDATED_EVENT = 'career-raffle-storage-updated';
export const STORAGE_SYNC_STATUS_EVENT = 'career-raffle-sync-status';

export interface PersistedAppState {
  version: 1;
  revision?: number;
  updatedAt?: string;
  raffles: Record<string, Raffle>;
  order: string[];
  branding: BrandingSettings;
}

export interface PersistSyncStatus {
  mode: 'github' | 'local';
  syncing: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
  pendingChanges: boolean;
}

let cachedState: PersistedAppState | null = null;
let githubSha: string | null = null;
let initialized = false;
let initPromise: Promise<void> | null = null;
let githubWriteChain: Promise<void> = Promise.resolve();
let writesInFlight = 0;
let localDirty = false;
let syncStatus: PersistSyncStatus = {
  mode: isGitHubStorageConfigured() ? 'github' : 'local',
  syncing: false,
  lastSyncedAt: null,
  lastError: null,
  pendingChanges: false,
};

function createDefaultState(): PersistedAppState {
  const demo = createDemoRaffle();
  return normalizeAppState({
    version: 1,
    raffles: { [demo.id]: demo },
    order: [demo.id],
    branding: { ...DEFAULT_BRANDING },
  });
}

export function normalizeAppState(state: PersistedAppState): PersistedAppState {
  return {
    ...state,
    revision: state.revision ?? 0,
    updatedAt: state.updatedAt ?? '1970-01-01T00:00:00.000Z',
  };
}

function getRevision(state: PersistedAppState | null | undefined): number {
  return state?.revision ?? 0;
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
    return isPersistedAppState(parsed) ? normalizeAppState(parsed) : null;
  } catch {
    return null;
  }
}

function writeLocalState(state: PersistedAppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setSyncStatus(patch: Partial<PersistSyncStatus>): void {
  syncStatus = {
    ...syncStatus,
    ...patch,
    pendingChanges: patch.pendingChanges ?? (localDirty || writesInFlight > 0),
  };
  window.dispatchEvent(new CustomEvent(STORAGE_SYNC_STATUS_EVENT));
}

export function getPersistSyncStatus(): PersistSyncStatus {
  return {
    ...syncStatus,
    pendingChanges: localDirty || writesInFlight > 0,
  };
}

function notifyStorageUpdated(): void {
  window.dispatchEvent(new CustomEvent(STORAGE_UPDATED_EVENT));
}

async function persistToGitHub(state: PersistedAppState): Promise<void> {
  const config = getGitHubStorageConfig();
  if (!config) return;

  writesInFlight += 1;
  setSyncStatus({ syncing: true, lastError: null });

  try {
    githubSha = await writeGitHubAppStateWithRetry(config, state, githubSha, (remote) =>
      mergeAppStates(state, remote),
    );
    localDirty = false;
    setSyncStatus({
      syncing: false,
      lastSyncedAt: new Date().toISOString(),
      lastError: null,
      pendingChanges: false,
    });
  } catch (error) {
    const message =
      error instanceof GitHubConflictError
        ? 'Another screen updated the raffle data. Your changes are saved locally and will retry.'
        : error instanceof Error
          ? error.message
          : 'Could not save to GitHub.';
    setSyncStatus({ syncing: false, lastError: message, pendingChanges: true });
    throw error;
  } finally {
    writesInFlight = Math.max(0, writesInFlight - 1);
    setSyncStatus({ pendingChanges: localDirty || writesInFlight > 0 });
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
          const local = readLocalState();
          if (remote) {
            cachedState = normalizeAppState(
              local ? mergeAppStates(normalizeAppState(local), remote.state) : remote.state,
            );
            githubSha = remote.sha;
            if (local && JSON.stringify(local) !== JSON.stringify(cachedState)) {
              localDirty = true;
              queueGitHubPersist(cachedState);
            }
          } else {
            cachedState = local ?? createDefaultState();
            localDirty = true;
            githubSha = await writeGitHubAppStateWithRetry(config, cachedState, null, (remote) =>
              mergeAppStates(cachedState!, remote),
            );
            localDirty = false;
          }
          writeLocalState(cachedState);
          setSyncStatus({
            syncing: false,
            lastSyncedAt: new Date().toISOString(),
            lastError: null,
            pendingChanges: localDirty,
          });
        } catch (error) {
          cachedState = readLocalState() ?? createDefaultState();
          writeLocalState(cachedState);
          setSyncStatus({
            syncing: false,
            lastError:
              error instanceof Error ? error.message : 'Could not load data from GitHub.',
            pendingChanges: false,
          });
        }
      } else {
        cachedState = readLocalState() ?? createDefaultState();
        writeLocalState(cachedState);
        setSyncStatus({ mode: 'local', syncing: false, lastError: null, pendingChanges: false });
      }

      initialized = true;
      notifyStorageUpdated();
    })();
  }

  await initPromise;
}

export async function refreshPersistedStateFromGitHub(): Promise<boolean> {
  const config = getGitHubStorageConfig();
  if (!config || writesInFlight > 0) return false;

  try {
    const remote = await readGitHubAppState(config);
    if (!remote) return false;

    const remoteState = normalizeAppState(remote.state);
    const localState = normalizeAppState(cachedState ?? remoteState);
    const remoteRevision = getRevision(remoteState);
    const localRevision = getRevision(localState);

    // GitHub can briefly return an older file right after we save. Never downgrade.
    if (remoteRevision < localRevision) {
      return false;
    }

    const remoteHasNewCommit = githubSha !== remote.sha;
    if (!remoteHasNewCommit) {
      return false;
    }

    if (remoteRevision === localRevision && !localDirty) {
      return false;
    }

    if (localDirty) {
      const merged = normalizeAppState(mergeAppStates(localState, remoteState));
      cachedState = merged;
      githubSha = remote.sha;
      writeLocalState(merged);
      notifyStorageUpdated();
      queueGitHubPersist(merged);
    } else {
      cachedState = remoteState;
      githubSha = remote.sha;
      writeLocalState(remoteState);
      notifyStorageUpdated();
    }

    setSyncStatus({
      lastSyncedAt: new Date().toISOString(),
      lastError: null,
    });

    return true;
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
  const nextState = normalizeAppState({
    ...state,
    revision: getRevision(cachedState) + 1,
    updatedAt: new Date().toISOString(),
  });
  cachedState = nextState;
  localDirty = true;
  writeLocalState(nextState);
  setSyncStatus({ pendingChanges: true });
  notifyStorageUpdated();

  const persistJob = queueGitHubPersist(nextState);
  await persistJob;
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

function startGitHubPolling(): () => void {
  const poll = () => {
    refreshPersistedStateFromGitHub().catch(() => {
      // Sync status already updated.
    });
  };

  const pollId = window.setInterval(poll, GITHUB_POLL_MS);

  const onVisible = () => {
    if (document.visibilityState === 'visible') poll();
  };
  document.addEventListener('visibilitychange', onVisible);

  const onFocus = () => poll();
  window.addEventListener('focus', onFocus);

  return () => {
    window.clearInterval(pollId);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('focus', onFocus);
  };
}

export function subscribeToStorageUpdates(listener: () => void): () => void {
  const onCustom = () => listener();
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };

  window.addEventListener(STORAGE_UPDATED_EVENT, onCustom);
  window.addEventListener('storage', onStorage);

  const stopPolling = isGitHubStorageConfigured() ? startGitHubPolling() : () => {};

  return () => {
    window.removeEventListener(STORAGE_UPDATED_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
    stopPolling();
  };
}

export function subscribeToSyncStatus(listener: () => void): () => void {
  const onSyncStatus = () => listener();
  window.addEventListener(STORAGE_SYNC_STATUS_EVENT, onSyncStatus);
  return () => window.removeEventListener(STORAGE_SYNC_STATUS_EVENT, onSyncStatus);
}
