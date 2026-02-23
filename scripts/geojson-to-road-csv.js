/**
 * Exports Rangailunda roads from GeoJSON to Road_Data_Collection CSV format.
 * Run from repo root:
 *   node ama-gopalpur-ui/scripts/geojson-to-road-csv.js
 * Writes: templates/Road_Data_Collection.csv (Rangailunda filled; Kukudakhandi and Berhampur Urban-I empty for department to fill).
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const geojsonPath = path.join(__dirname, '../public/data/roads/rangailunda.json');
const outPath = path.join(repoRoot, 'templates/Road_Data_Collection.csv');
const outPathAlt = path.join(repoRoot, 'templates/Road_Data_Collection_filled.csv');

function escapeCsvCell(s) {
  if (s == null) return '';
  const str = String(s).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
const header = 'block,road_name,road_code,path_coordinates,start_lat,start_lng,end_lat,end_lng';

/** Remove consecutive duplicate points (source KML had repeated coordinates). */
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

const rows = (geojson.features || []).map((f) => {
  const p = f.properties || {};
  const block = (p.block || 'Rangailunda').trim();
  const roadName = (p.name || p.roadName || '').trim();
  const code = (p.code || '').trim();
  const coords = dedupeCoordinates(f.geometry?.coordinates || []);
  const pathStr = coords.map(([lng, lat]) => `${lng},${lat}`).join(';');
  return [
    escapeCsvCell(block),
    escapeCsvCell(roadName),
    escapeCsvCell(code),
    escapeCsvCell(pathStr),
    '',
    '',
    '',
    '',
  ].join(',');
});

// Header + all Rangailunda rows + empty rows for Kukudakhandi and Berhampur Urban-I (so they know the format)
const emptyKukudakhandi = 'Kukudakhandi,,,,,,,';
const emptyBerhampur = 'Berhampur Urban-I,,,,,,,';

const csv = [header, ...rows, emptyKukudakhandi, emptyBerhampur].join('\n');
const outDir = path.dirname(outPath);
function writeOutput() {
  try {
    fs.writeFileSync(outPath, csv, 'utf8');
    console.log('Wrote %d Rangailunda roads + 2 empty rows to %s', rows.length, outPath);
    return;
  } catch (e) {
    if (e.code !== 'EBUSY' && e.code !== 'EPERM') throw e;
  }
  try {
    fs.writeFileSync(outPathAlt, csv, 'utf8');
    console.log('Wrote %d Rangailunda roads + 2 empty rows to %s', rows.length, outPathAlt);
    return;
  } catch (e) {
    if (e.code !== 'EBUSY' && e.code !== 'EPERM') throw e;
  }
  const fallback = path.join(outDir, 'Road_Data_Collection_deduplicated.csv');
  fs.writeFileSync(fallback, csv, 'utf8');
  console.log('Wrote %d Rangailunda roads + 2 empty rows to %s (other files were locked)', rows.length, fallback);
}
writeOutput();
