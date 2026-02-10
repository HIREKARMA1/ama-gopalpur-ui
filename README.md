# AMA Gopalpur – Frontend (`ama-gopalpur-ui`)

This is the **Next.js frontend** for the AMA Gopalpur constituency dashboard. It provides a map-first view of the constituency with a department sidebar, organizations list, and (future) rich profiles and analytics.

## Tech Stack

- Next.js (App Router)
- React 18
- Tailwind CSS
- next-themes (light/dark mode)
- Docker + docker-compose

## Project Structure

- `app/` – main application (layout, pages, global styles)
- `components/` – reusable layout, map, department, and organization components
- `services/api.ts` – API client using logical hostname `http://api:8000`
- `docker-compose/` – frontend docker-compose and env

Theme colors, fonts, and dark/light mode are driven by CSS variables in `app/globals.css` so you can adjust the entire UI from a single place. For UI design notes, see `documents/UI_OVERVIEW.md`.

## Setup & Run

### 1. Local development (no Docker)

1. From `ama-gopalpur-ui`:

   ```bash
   npm install
   ```

2. Create `.env.local` with:

   ```bash
   NEXT_PUBLIC_API_URL=http://api:8000
   ```

3. Ensure your hosts file has:

   ```text
   127.0.0.1 api
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000` while calling the backend via `http://api:8000`.

### 2. Docker (recommended for consistent env)

1. Ensure the shared external network exists (one-time):

   ```bash
   docker network create job-scraper-network
   ```

2. From `ama-gopalpur-ui/docker-compose`:

   ```bash
   docker-compose up -d --build
   ```

This starts the frontend on port `3000`, configured to use `http://api:8000` for API calls inside the Docker network.

