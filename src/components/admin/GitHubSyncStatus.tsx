import { useEffect, useState } from 'react';
import {
  getPersistSyncStatus,
  subscribeToSyncStatus,
  type PersistSyncStatus,
} from '../../services/storage/persistentStore';
import './GitHubSyncStatus.css';

export function GitHubSyncStatus() {
  const [status, setStatus] = useState<PersistSyncStatus>(() => getPersistSyncStatus());

  useEffect(() => subscribeToSyncStatus(() => setStatus(getPersistSyncStatus())), []);

  if (status.mode === 'local') {
    return (
      <p className="github-sync github-sync--local">
        Local-only mode. Add GitHub env vars to save to the repo at runtime.
      </p>
    );
  }

  return (
    <p
      className={`github-sync${status.lastError ? ' github-sync--error' : ''}${
        status.syncing ? ' github-sync--syncing' : ''
      }`}
    >
      {status.syncing
        ? 'Saving to GitHub…'
        : status.pendingChanges
          ? 'Saved locally — syncing to GitHub…'
          : status.lastError
            ? status.lastError
            : status.lastSyncedAt
              ? 'Synced to GitHub'
              : 'Connected to GitHub'}
    </p>
  );
}
