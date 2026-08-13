/**
 * Converts Rangailunda roads KML (doc.kml) to GeoJSON FeatureCollection.
 * Run from repo root: node ama-gopalpur-ui/scripts/kml-to-geojson.js
 * Reads (first existing):
 *   ama-gopalpur-server/doc.kml
 *   templates/Road/Rangailunda_extracted/doc.kml
 * Writes: ama-gopalpur-ui/public/data/roads/rangailunda.json
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const candidateKmlPaths = [
  path.join(repoRoot, 'ama-gopalpur-server/doc.kml'),
  path.join(repoRoot, 'templates/Road/Rangailunda_extracted/doc.kml'),
];
const kmlPath = candidateKmlPaths.find((p) => fs.existsSync(p));
if (!kmlPath) {
  console.error('No KML found. Expected one of:\n' + candidateKmlPaths.join('\n'));
  process.exit(1);
}

const outDir = path.join(__dirname, '../public/data/roads');
const outPath = path.join(outDir, 'rangailunda.json');

const kml = fs.readFileSync(kmlPath, 'utf8');

function getText(tag, blob) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = blob.match(re);
  return m ? m[1].trim() : '';
}

function getDataValue(name, blob) {
  const re = new RegExp(`<Data name="${name}"[^>]*>\\s*<value>([^<]*)</value>`, 'i');
  const m = blob.match(re);
  return m ? m[1].trim() : '';
}

/** Parse "A to B" / "A TO B" / "A - B" style names into start/end labels. */
function parsePointNames(roadName) {
  const name = String(roadName || '').trim();
  if (!name) return { pointA: '', pointB: '' };
  const match = name.match(/^\s*(.+?)\s+(?:to|-|–|—)\s+(.+?)\s*$/i);
  if (!match) return { pointA: '', pointB: '' };
  return { pointA: match[1].trim(), pointB: match[2].trim() };
}

/** Remove consecutive duplicate points (source KML often repeats coordinates). */
function dedupeCoordinates(coords) {
  if (!coords || coords.length < 2) return coords || [];
  const out = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    if (prev[0] !== curr[0] || prev[1] !== curr[1]) out.push(curr);
  }
  return out;
}

const placemarkRe = /<Placemark[^>]*>([\s\S]*?)<\/Placemark>/gi;
const features = [];
let match;
while ((match = placemarkRe.exec(kml)) !== null) {
  const block = match[1];
  const name = getText('name', block);
  const coordinatesStr = getText('coordinates', block);
  if (!coordinatesStr) continue;

  const roadN = getDataValue('Road_N', block) || name;
  const existingN = getDataValue('Existing_N', block) || '';
  const blockN = getDataValue('Block_N', block) || 'Rangailunda';
  const { pointA, pointB } = parsePointNames(roadN || name);

  const rawCoords = coordinatesStr
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((triple) => {
      const [lng, lat] = triple.split(',').map(Number);
      return [lng, lat];
    })
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));

  const coords = dedupeCoordinates(rawCoords);
  if (coords.length < 2) continue;

  features.push({
    type: 'Feature',
    properties: {
      name: name || roadN,
      roadName: roadN,
      code: existingN,
      block: blockN === 'Rengailunda' ? 'Rangailunda' : blockN,
      pointAName: pointA || null,
      pointBName: pointB || null,
    },
    geometry: {
      type: 'LineString',
      coordinates: coords,
    },
  });
}

const geojson = {
  type: 'FeatureCollection',
  features,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(geojson, null, 2), 'utf8');
console.log(`Read ${kmlPath}`);
console.log(`Wrote ${features.length} road features to ${outPath}`);
