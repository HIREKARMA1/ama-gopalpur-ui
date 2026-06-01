/**
 * Builds drainage bulk-upload CSV from Bahana KML.
 *
 * Run from repo root:
 *   node ama-gopalpur-ui/scripts/geojson-to-drainage-csv.js --csv-only
 *
 * Output:
 *   templates/drainage/bahana_drains_bulk_upload.csv
 *   templates/drainage/bahana_drains_review.csv (no path — safe to open in Excel)
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const kmlPath = path.join(repoRoot, 'templates/drainage/Bahana Drainage System 24.02.2026.kml');
const jsonPath = path.join(repoRoot, 'ama-gopalpur-ui/public/data/drainage/bahana.json');

/** Main drainage project (from KML title), not block/ULB. */
const PROJECT_NAME = 'Bahana';
const PROJECT_REMARKS = 'Bahana Drainage System (KML 24.02.2026)';

const BASE_HEADER =
  'PROJECT NAME,DRAIN NAME,DRAIN TYPE,LENGTH (KM),START LATITUDE,START LONGITUDE,END LATITUDE,END LONGITUDE,REMARKS';

const CSV_HEADER = `${BASE_HEADER},PATH COORDINATES`;
const REVIEW_HEADER = BASE_HEADER;

function getDrainLineKind(drainName) {
  const n = drainName || '';
  if (/\bbranch\b/i.test(n) || /\blink\b/i.test(n) || /-L-\d+/i.test(n)) {
    return 'BRANCH';
  }
  return 'MAIN';
}

function escapeCsv(value) {
  const s = value == null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Excel cannot display cells over 32,767 characters — simplify path if needed. */
const EXCEL_MAX_PATH_CHARS = 30000;

function pathCoordinatesField(coords) {
  return coords
    .map(([lng, lat]) => `${Number(lng).toFixed(6)} ${Number(lat).toFixed(6)}`)
    .join('|');
}

/** Keep first/last point; decimate middle until path string fits Excel. */
function coordsForExcel(coords) {
  let field = pathCoordinatesField(coords);
  if (field.length <= EXCEL_MAX_PATH_CHARS) return { coords, simplified: false };

  for (let step = 2; step < coords.length; step += 1) {
    const reduced = coords.filter(
      (_, i) => i === 0 || i === coords.length - 1 || i % step === 0,
    );
    if (reduced.length < 2) break;
    field = pathCoordinatesField(reduced);
    if (field.length <= EXCEL_MAX_PATH_CHARS) {
      return { coords: reduced, simplified: true };
    }
  }
  return { coords, simplified: false };
}

function loadFeaturesFromKml(filePath) {
  const kml = fs.readFileSync(filePath, 'utf8');
  const placemarkRe = /<Placemark[^>]*>([\s\S]*?)<\/Placemark>/gi;
  const getText = (tag, blob) => {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const m = blob.match(re);
    return m ? m[1].trim() : '';
  };
  const features = [];
  let match;
  while ((match = placemarkRe.exec(kml)) !== null) {
    const block = match[1];
    const name = getText('name', block);
    const coordinatesStr = getText('coordinates', block);
    if (!coordinatesStr) continue;
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
    if (coords.length < 2) continue;
    features.push({
      properties: { name: name || 'Drain' },
      geometry: { type: 'LineString', coordinates: coords },
    });
  }
  return features;
}

function loadFeatures() {
  if (fs.existsSync(jsonPath)) {
    const fc = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    return fc.features || [];
  }
  if (fs.existsSync(kmlPath)) {
    return loadFeaturesFromKml(kmlPath);
  }
  throw new Error(`No source found. Add KML at ${kmlPath}`);
}

function buildRows() {
  const features = loadFeatures();
  const csvRows = [CSV_HEADER];
  const reviewRows = [REVIEW_HEADER];
  let skipped = 0;

  for (const feature of features) {
    const name = (feature.properties?.name || '').trim();
    const coords = feature.geometry?.coordinates;
    if (!name || !Array.isArray(coords) || coords.length < 2) {
      skipped += 1;
      continue;
    }
    const clean = coords.filter(
      (pt) => Array.isArray(pt) && pt.length >= 2 && Number.isFinite(pt[0]) && Number.isFinite(pt[1]),
    );
    if (clean.length < 2) {
      skipped += 1;
      continue;
    }

    const start = clean[0];
    const end = clean[clean.length - 1];
    let lengthKm = 0;
    for (let i = 1; i < clean.length; i += 1) {
      lengthKm += haversineKm(clean[i - 1], clean[i]);
    }

    const { coords: pathCoords, simplified } = coordsForExcel(clean);
    const lineKind = getDrainLineKind(name);
    const remarks = simplified
      ? `${PROJECT_REMARKS}; path simplified for Excel/upload`
      : PROJECT_REMARKS;

    const baseFields = [
      PROJECT_NAME,
      name,
      lineKind,
      lengthKm.toFixed(3),
      start[1].toFixed(6),
      start[0].toFixed(6),
      end[1].toFixed(6),
      end[0].toFixed(6),
      remarks,
    ];
    const pathFull = pathCoordinatesField(pathCoords);
    if (simplified) {
      console.warn(`  Simplified path for "${name}" (${clean.length} → ${pathCoords.length} points) for Excel`);
    }
    reviewRows.push(baseFields.map(escapeCsv).join(','));
    csvRows.push([...baseFields, pathFull].map(escapeCsv).join(','));
  }

  return { csvRows, reviewRows, skipped };
}

const cliArgs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const outBase = path.join(repoRoot, cliArgs[0] || 'templates/drainage/bahana_drains_bulk_upload');
const { csvRows, reviewRows, skipped } = buildRows();

let csvPath = outBase.endsWith('.csv') ? outBase : `${outBase}.csv`;
const reviewOut = path.join(path.dirname(csvPath), 'bahana_drains_review.csv');

function writeUtf8(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  } catch (err) {
    if (err && err.code === 'EBUSY') {
      const alt = filePath.replace(/\.csv$/i, '_v2.csv');
      fs.writeFileSync(alt, content, 'utf8');
      return alt;
    }
    throw err;
  }
}

const mainCount = csvRows.slice(1).filter((row) => row.includes('"MAIN"') || row.includes(',MAIN,')).length;
const branchCount = csvRows.length - 1 - mainCount;

fs.mkdirSync(path.dirname(csvPath), { recursive: true });
csvPath = writeUtf8(csvPath, `\uFEFF${csvRows.join('\r\n')}\r\n`);
writeUtf8(reviewOut, `\uFEFF${reviewRows.join('\r\n')}\r\n`);

console.log(`Wrote ${csvRows.length - 1} drains (skipped ${skipped}) — MAIN: ${mainCount}, BRANCH: ${branchCount}`);
console.log(`  Upload CSV:  ${csvPath}`);
console.log(`  Review CSV:  ${reviewOut}`);
