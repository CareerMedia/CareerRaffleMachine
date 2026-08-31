export interface GitHubStorageConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

export function getGitHubStorageConfig(): GitHubStorageConfig | null {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  const owner = import.meta.env.VITE_GITHUB_OWNER;
  const repo = import.meta.env.VITE_GITHUB_REPO;
  const branch = import.meta.env.VITE_GITHUB_BRANCH || 'main';
  const path = import.meta.env.VITE_GITHUB_DATA_PATH || 'data/app-state.json';

  if (!token || !owner || !repo) return null;

  return { token, owner, repo, branch, path };
}

export function isGitHubStorageConfigured(): boolean {
  return getGitHubStorageConfig() !== null;
}
