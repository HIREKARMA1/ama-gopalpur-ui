# AMA Gopalpur Frontend – UI Overview

The frontend is a Next.js application designed around a **map-first** interaction:

- Left sidebar: list of departments (NH, PWD, Education, Health, etc.).
- Main area: constituency map (placeholder for now) and organizations list.
- Future: organization profile panel with tabs for images, description, location, and metric tables + charts.

## Theming

- Colors and fonts are driven by CSS variables in `app/globals.css`.
- Primary color is orange for Gopalpur, and dark mode is supported via `next-themes`.
- To change brand color or font globally, edit the variables in `globals.css`.

## API Integration

- All API calls use `services/api.ts` with base URL:
  - `const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api:8000';`
- This keeps config environment-agnostic; you only set `NEXT_PUBLIC_API_URL` in env files or docker-compose.

