import type { PersistedAppState } from './persistentStore';
import type { GitHubStorageConfig } from './githubConfig';

const GITHUB_API = 'https://api.github.com';

interface GitHubContentsResponse {
  content?: string;
  sha: string;
}

export class GitHubConflictError extends Error {
  constructor() {
    super('GitHub file was updated elsewhere. Retrying…');
    this.name = 'GitHubConflictError';
  }
}

function githubHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

function toBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64Utf8(base64: string): string {
  const normalized = base64.replace(/\s/g, '');
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function contentsUrl(config: GitHubStorageConfig): string {
  return `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${config.path}`;
}

export async function readGitHubAppState(
  config: GitHubStorageConfig,
): Promise<{ state: PersistedAppState; sha: string } | null> {
  const url = `${contentsUrl(config)}?ref=${encodeURIComponent(config.branch)}`;
  const response = await fetch(url, { headers: githubHeaders(config.token) });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub read failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as GitHubContentsResponse;
  if (!payload.content) {
    throw new Error('GitHub file response did not include content.');
  }

  const decoded = fromBase64Utf8(payload.content);
  const state = JSON.parse(decoded) as PersistedAppState;

  return { state, sha: payload.sha };
}

export async function writeGitHubAppState(
  config: GitHubStorageConfig,
  state: PersistedAppState,
  sha: string | null,
): Promise<string> {
  const response = await fetch(contentsUrl(config), {
    method: 'PUT',
    headers: githubHeaders(config.token),
    body: JSON.stringify({
      message: `chore(data): update raffle app state`,
      content: toBase64Utf8(JSON.stringify(state, null, 2)),
      branch: config.branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (response.status === 409) {
    throw new GitHubConflictError();
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub write failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as { content: { sha: string } };
  return payload.content.sha;
}

export async function writeGitHubAppStateWithRetry(
  config: GitHubStorageConfig,
  state: PersistedAppState,
  sha: string | null,
  mergeWithRemote: (remote: PersistedAppState) => PersistedAppState,
  maxAttempts = 5,
): Promise<string> {
  let currentSha = sha;
  let payload = state;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await writeGitHubAppState(config, payload, currentSha);
    } catch (error) {
      if (error instanceof GitHubConflictError && attempt < maxAttempts - 1) {
        const remote = await readGitHubAppState(config);
        if (remote) {
          payload = mergeWithRemote(remote.state);
          currentSha = remote.sha;
        }
        continue;
      }
      throw error;
    }
  }

  throw new Error('Could not save to GitHub after multiple attempts.');
}
