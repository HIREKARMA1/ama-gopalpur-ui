# Map setup – Google Maps (Gopalpur constituency)

## API key

1. Create a Google Cloud project and enable **Maps JavaScript API**.
2. Create an API key and (recommended) restrict it by HTTP referrer to your app’s domains.
3. Set the key in the frontend:
   - **Local**: in `ama-gopalpur-ui/.env.local`:
     ```bash
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
     ```
   - **Docker**: in `ama-gopalpur-ui/docker-compose/.env` add the same variable.

If the key is missing, the app shows a short message instead of the map.

## Behaviour

- **Area**: The map is restricted to the **Gopalpur Assembly constituency**, covering **Rangeilunda**, **Kukudakhandi** and **Berhampur Urban-I** blocks (Ganjam, Odisha). Center and bounds are in `lib/mapConfig.ts`; you can adjust them there.
- **Departments**: When you click a department in the sidebar, the app fetches that department’s organizations and shows them as pins. Currently only **Education** has distinct pin colours; other departments use a single default pin.
- **Education pin colours** (in `lib/mapConfig.ts`):
  - Primary School – red  
  - Upper Primary School – blue  
  - High School – green  
  - Higher Secondary – orange  
  - College – purple  
  - University – yellow  

## Organizations without a location

Organizations that have no `latitude`/`longitude` in the database are **not** shown on the map. For rural or unlisted places:

- A **department admin** can add a new organization (or edit an existing one) and set a **custom location** (lat/lng). That organization will then appear as a pin on the map.
- The backend already supports `latitude`, `longitude`, and `address` on organizations; the admin UI for editing/adding organizations will use these fields so admins can “add” places that are not on Google Maps.
