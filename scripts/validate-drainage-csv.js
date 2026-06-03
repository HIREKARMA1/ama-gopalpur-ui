/**
 * Validates drainage bulk file column count (12).
 * Usage: node ama-gopalpur-ui/scripts/validate-drainage-csv.js <path.tsv|.csv>
 */
const fs = require('fs');
const path = process.argv[2];
if (!path) {
  console.error('Usage: node validate-drainage-csv.js <file>');
  process.exit(1);
}

const text = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
const lines = text.trim().split(/\r?\n/);
const first = lines[0] || '';
const isTsv = first.includes('\t') && first.split('\t').length >= first.split(',').length;

function parseCsvLine(line) {
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

function parseLine(line) {
  return isTsv ? line.split('\t') : parseCsvLine(line);
}

let bad = 0;
for (let i = 0; i < lines.length; i += 1) {
  const cols = parseLine(lines[i]);
  const okCols = [8, 9, 10, 11, 12, 13, 15];
  const expected = okCols.includes(cols.length) ? cols.length : null;
  if (expected == null || cols.length !== expected) {
    console.log('BAD row', i + 1, 'cols', cols.length, isTsv ? '(tsv)' : '(csv)');
    bad += 1;
  } else if (i > 0 && i <= 3) {
    const pathLen = cols.length >= 10 ? cols[9]?.length || 0 : cols[cols.length - 1]?.length || 0;
    console.log('OK row', i + 1, {
      project: cols[0]?.slice(0, 24),
      drain: cols[1]?.slice(0, 40),
      drainType: cols[2] || '(n/a)',
      pathLen: cols.length >= 10 ? pathLen : 0,
    });
  }
}
const colNote = lines[0] ? String(parseLine(lines[0]).length) : '?';
console.log(
  bad ? `${bad} bad rows` : `All ${lines.length - 1} data rows have ${colNote} columns (${isTsv ? 'TSV' : 'CSV'})`,
);
