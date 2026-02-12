# AMA Gopalpur Frontend – UI Overview

The frontend is a Next.js application designed around a **map-first** interaction:

- Left sidebar: list of departments (NH, PWD, Education, Health, etc.).
- Main area: **Google Map restricted to the Gopalpur constituency** (Rangeilunda, Kukudakhandi, Berhampur Urban-I) and organizations list.
- Clicking a department loads its organizations and shows them as pins on the map. For **Education**, each type (Primary School, Upper Primary, High School, Higher Secondary, College, University) has a **different coloured pin**; other departments use a default pin.
- Future: organization profile panel with tabs for images, description, location, and metric tables + charts.

## Google Map (Gopalpur constituency)

- The map shows **only the Gopalpur Assembly constituency area** (Rangeilunda, Kukudakhandi, Berhampur Urban-I), not the entire world. Bounds and center are in `lib/mapConfig.ts`.
- **API key**: set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local` (and in `docker-compose/.env` for Docker). Without it, the app shows a friendly message instead of the map.
- Organizations **without latitude/longitude** do not appear on the map. **Department admins can add new organizations** (including those not listed on Google Maps in rural areas) with a custom location (lat/lng) via the admin flow so they appear as pins.

## Theming

- Colors and fonts are driven by CSS variables in `app/globals.css`.
- Primary color is orange for Gopalpur, and dark mode is supported via `next-themes`.
- To change brand color or font globally, edit the variables in `globals.css`.

## API Integration

- All API calls use `services/api.ts` with base URL:
  - `const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api:8000';`
- This keeps config environment-agnostic; you only set `NEXT_PUBLIC_API_URL` in env files or docker-compose.

