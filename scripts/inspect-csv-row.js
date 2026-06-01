const fs = require('fs');
const p = process.argv[2] || 'e:/HK/ama-gopalpur/templates/drainage/bahana_drains_bulk_upload_v2.csv';
const lines = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/);

function parseLine(line) {
  const out = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cell);
      cell = '';
    } else {
      cell += ch;
    }
  }
  out.push(cell);
  return out;
}

lines.forEach((line, idx) => {
  const cols = parseLine(line);
  if (idx === 0) return;
  const pathLen = cols[9]?.length || 0;
  if (pathLen > 32767 || idx <= 6) {
    console.log(
      `Row ${idx + 1}: ${cols[1]?.slice(0, 30)} | path ${pathLen} chars${pathLen > 32767 ? ' **EXCEEDS EXCEL LIMIT**' : ''}`,
    );
  }
});
