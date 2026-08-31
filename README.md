# CSUN Career Center Raffle

Premium full-screen raffle experience for Career Center events and live displays.

## Run Locally

```bash
npm install
cp .env.example .env
# Add your GitHub token + repo details to .env
npm run dev
```

## Live URLs

Base: `https://careermedia.github.io/CareerRaffleMachine/`

| Route | Description |
|-------|-------------|
| `#/display` | Full-screen wheel for the active raffle |
| `#/display/:raffleId` | Full-screen wheel for a specific raffle |
| `#/admin/raffles` | Raffle manager (create / edit / delete) |
| `#/admin/raffles/:id` | Raffle editor |
| `#/admin/branding` | Logo upload + backup tools |

Path-style links such as `/CareerRaffleMachine/display` also work: GitHub Pages serves
`404.html`, which redirects to the matching hash route.

## GitHub Pages Setup (required once)

**Settings → Pages → Build and deployment → Source = `GitHub Actions`.**

If Source is left on "Deploy from a branch", Pages publishes the raw repository
(source `index.html` referencing `/src/main.tsx`), which renders a blank white screen
and 404s on every route. The deploy workflow calls `actions/configure-pages` to correct
this automatically, but verify the setting after the first run.

## GitHub Runtime Persistence

Every raffle save, participant edit, winner draw, and branding change is written to
`data/app-state.json` in your GitHub repo via the [GitHub Contents API](https://docs.github.com/en/rest/repos/contents).

### Setup

1. Create a GitHub Personal Access Token with **Contents: Read and write** on this repo.
2. Copy `.env.example` to `.env` and fill in:

```env
VITE_GITHUB_TOKEN=ghp_...
VITE_GITHUB_OWNER=your-github-username-or-org
VITE_GITHUB_REPO=CareerRaffleMachine
VITE_GITHUB_BRANCH=main
VITE_GITHUB_DATA_PATH=data/app-state.json
```

3. For GitHub Pages deploys, add the same token as a repository secret named `RAFFLE_GITHUB_TOKEN`
   (the deploy workflow injects it at build time).

The admin sidebar shows GitHub sync status. If GitHub is not configured, the app falls back to
browser local storage only.

## Build & Deploy (GitHub Pages)

```bash
npm run build:pages
```

Or use the included GitHub Actions workflow (`.github/workflows/deploy.yml`) for automatic deployment on push to `main`.

Deploy the `dist/` folder to GitHub Pages. The project uses browser routing with `base: '/CareerRaffleMachine/'` and a `404.html` SPA fallback for direct links like `/display` and `/admin`.

## Tech Stack

- React + TypeScript + Vite
- React Router (HashRouter)
- Framer Motion + GSAP
- Lucide React
- GitHub Contents API (runtime data persistence)

## Design

See [DESIGN.md](./DESIGN.md) for the visual system documentation.
