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

let maxCell = 0;
let maxAt = '';
lines.forEach((line, idx) => {
  const cols = parseLine(line);
  cols.forEach((c, ci) => {
    if (c.length > maxCell) {
      maxCell = c.length;
      maxAt = `L${idx + 1} col ${ci + 1}`;
    }
  });
  if (idx > 0 && idx <= 8) {
    console.log(
      `L${idx + 1}: cols=${cols.length} block=${JSON.stringify(cols[0])} path1=${cols[12]?.length || 0} path2=${cols[13]?.length || 0}`,
    );
  }
});
console.log(`Max cell: ${maxCell} at ${maxAt} (Excel limit 32767)`);
