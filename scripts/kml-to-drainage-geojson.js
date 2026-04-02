/**
 * Converts Bahana drainage system KML to GeoJSON FeatureCollection.
 *
 * Run from repo root:
 *   node ama-gopalpur-ui/scripts/kml-to-drainage-geojson.js
 *
 * Reads:
 *   templates/drainage/Bahana Drainage System 24.02.2026.kml
 *
 * Writes:
 *   ama-gopalpur-ui/public/data/drainage/bahana.json
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const kmlPath = path.join(
  repoRoot,
  'templates/drainage/Bahana Drainage System 24.02.2026.kml',
);

const outDir = path.join(__dirname, '../public/data/drainage');
const outPath = path.join(outDir, 'bahana.json');

const kml = fs.readFileSync(kmlPath, 'utf8');

function getText(tag, blob) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = blob.match(re);
  return m ? m[1].trim() : '';
}

const placemarkRe = /<Placemark[^>]*>([\s\S]*?)<\/Placemark>/gi;
const features = [];
let match;

function dedupeConsecutive(coords) {
  if (!coords || coords.length < 2) return coords || [];
  const out = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    if (prev[0] !== curr[0] || prev[1] !== curr[1]) out.push(curr);
  }
  return out;
}

while ((match = placemarkRe.exec(kml)) !== null) {
  const block = match[1];
  const name = getText('name', block);
  const coordinatesStr = getText('coordinates', block);
  if (!coordinatesStr) continue;

  // KML coordinates look like: lng,lat,alt lng,lat,alt ...
  const coords = coordinatesStr
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((triple) => {
      const parts = triple.split(',').map((x) => Number(x));
      const lng = parts[0];
      const lat = parts[1];
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
      return [lng, lat];
    })
    .filter(Boolean);

  const deduped = dedupeConsecutive(coords);
  if (deduped.length < 2) continue;

  features.push({
    type: 'Feature',
    properties: { name: name || 'Drain' },
    geometry: {
      type: 'LineString',
      coordinates: deduped,
    },
  });
}

const geojson = {
  type: 'FeatureCollection',
  features,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(geojson, null, 2), 'utf8');
console.log(`Wrote ${features.length} drainage features to ${outPath}`);

