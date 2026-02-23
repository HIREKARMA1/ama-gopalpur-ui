/**
 * Converts Rangailunda roads KML (doc.kml) to GeoJSON FeatureCollection.
 * Run from repo root: node ama-gopalpur-ui/scripts/kml-to-geojson.js
 * Reads: templates/Road/Rangailunda_extracted/doc.kml
 * Writes: ama-gopalpur-ui/public/data/roads/rangailunda.json
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const kmlPath = path.join(repoRoot, 'templates/Road/Rangailunda_extracted/doc.kml');
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

  const coords = coordinatesStr
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((triple) => {
      const [lng, lat] = triple.split(',').map(Number);
      return [lng, lat];
    });

  if (coords.length < 2) continue;

  features.push({
    type: 'Feature',
    properties: {
      name: name || roadN,
      roadName: roadN,
      code: existingN,
      block: 'Rangailunda',
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
console.log(`Wrote ${features.length} road features to ${outPath}`);
