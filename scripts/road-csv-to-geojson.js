/**
 * Converts Road Department filled CSV to GeoJSON per block.
 * Use after receiving the filled Road_Data_Collection.csv from the department.
 *
 * Run from repo root:
 *   node ama-gopalpur-ui/scripts/road-csv-to-geojson.js <path-to-filled-Road_Data_Collection.csv>
 *
 * Example:
 *   node ama-gopalpur-ui/scripts/road-csv-to-geojson.js templates/Road_Data_Collection.csv
 *
 * Reads: CSV with columns block, road_name, road_code, path_coordinates, start_lat, start_lng, end_lat, end_lng
 * Writes: ama-gopalpur-ui/public/data/roads/kukudakhandi.json, berhampur_urban.json (and rangailunda.json if that block appears in CSV).
 * Only overwrites files for blocks that have at least one row in the CSV.
 */

const fs = require('fs');
const path = require('path');

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node road-csv-to-geojson.js <path-to-Road_Data_Collection.csv>');
  process.exit(1);
}

const outDir = path.join(__dirname, '../public/data/roads');
const blockToFile = {
  Kukudakhandi: 'kukudakhandi.json',
  'Berhampur Urban-I': 'berhampur_urban.json',
  Rangailunda: 'rangailunda.json',
};

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      values.push(current.replace(/^"|"$/g, '').trim());
      current = '';
    } else {
      current += c;
    }
  }
  values.push(current.replace(/^"|"$/g, '').trim());
  return values;
}

function parseCSV(text) {
  const rows = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return rows;
  const headerRow = parseCSVLine(lines[0]);
  const header = headerRow.map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    header.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function parsePath(pathStr) {
  if (!pathStr || typeof pathStr !== 'string') return null;
  const trimmed = pathStr.trim();
  if (!trimmed) return null;
  const pairs = trimmed.split(';').map((p) => p.trim()).filter(Boolean);
  const coords = [];
  for (const p of pairs) {
    const parts = p.split(',').map((n) => parseFloat(n.trim()));
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      coords.push([parts[0], parts[1]]);
    }
  }
  return coords.length >= 2 ? coords : null;
}

function rowToFeature(row) {
  const block = (row.block || '').trim();
  const roadName = (row.road_name || row.roadname || '').trim() || 'Unnamed road';
  const roadCode = (row.road_code || row.roadcode || '').trim();

  let coordinates = parsePath(row.path_coordinates || row.pathcoordinates || '');
  if (!coordinates) {
    const slat = parseFloat(row.start_lat || row.startlat);
    const slng = parseFloat(row.start_lng || row.startlng);
    const elat = parseFloat(row.end_lat || row.endlat);
    const elng = parseFloat(row.end_lng || row.endlng);
    if (
      Number.isFinite(slat) && Number.isFinite(slng) &&
      Number.isFinite(elat) && Number.isFinite(elng)
    ) {
      coordinates = [[slng, slat], [elng, elat]];
    }
  }
  if (!coordinates || coordinates.length < 2) return null;

  return {
    type: 'Feature',
    properties: {
      name: roadName,
      roadName,
      code: roadCode,
      block: block || 'Unknown',
    },
    geometry: {
      type: 'LineString',
      coordinates,
    },
  };
}

const absCsvPath = path.isAbsolute(csvPath) ? csvPath : path.resolve(process.cwd(), csvPath);
if (!fs.existsSync(absCsvPath)) {
  console.error('File not found:', absCsvPath);
  process.exit(1);
}

const csvText = fs.readFileSync(absCsvPath, 'utf8');
const rows = parseCSV(csvText);

const byBlock = {};
rows.forEach((row) => {
  const feature = rowToFeature(row);
  if (!feature) return;
  const block = (row.block || '').trim() || 'Unknown';
  if (!byBlock[block]) byBlock[block] = [];
  byBlock[block].push(feature);
});

fs.mkdirSync(outDir, { recursive: true });

Object.entries(byBlock).forEach(([block, features]) => {
  const fileName = blockToFile[block];
  if (!fileName) {
    console.warn('Unknown block "%s", skipping. Known: Kukudakhandi, Berhampur Urban-I, Rangailunda.', block);
    return;
  }
  const outPath = path.join(outDir, fileName);
  const geojson = { type: 'FeatureCollection', features };
  fs.writeFileSync(outPath, JSON.stringify(geojson, null, 2), 'utf8');
  console.log('Wrote %d road(s) for "%s" -> %s', features.length, block, outPath);
});

const total = Object.values(byBlock).reduce((s, f) => s + f.length, 0);
console.log('Done. Total roads: %d', total);
