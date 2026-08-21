/* Folds a saved copy of the permanent log back into whatever the repo now has,
   without losing rows from either side.

     node merge-history.js <saved-file> [<saved-file> ...]

   The log is append-only, so two runs can both be right: the remote may have
   gained rows while this run was scraping. Rows are keyed on timestamp+domain,
   deduped, and written back in time order. Overwriting instead of merging would
   silently drop readings, which is the exact thing the log exists to prevent. */
const LF = String.fromCharCode(10);
const fs = require('fs'), path = require('path');

const files = process.argv.slice(2);
if (!files.length) { console.log('give me at least one saved ndjson to merge in'); process.exit(1); }

const dir = path.join(__dirname, 'history');
fs.mkdirSync(dir, { recursive: true });

const read = f => {
  if (!fs.existsSync(f)) return [];
  return fs.readFileSync(f, 'utf8').split(LF).filter(l => l.trim()).map(l => {
    try { return { key: null, obj: JSON.parse(l), line: l }; } catch (e) { return null; }
  }).filter(Boolean).map(r => { r.key = r.obj.t + '|' + r.obj.d; return r; });
};

for (const saved of files) {
  const month = path.basename(saved);
  const target = path.join(dir, month);
  const mine = read(saved);
  const theirs = read(target);

  const seen = new Map();
  for (const r of theirs) seen.set(r.key, r);
  let added = 0;
  for (const r of mine) if (!seen.has(r.key)) { seen.set(r.key, r); added++; }

  const rows = [...seen.values()].sort((a, b) => (a.obj.t < b.obj.t ? -1 : a.obj.t > b.obj.t ? 1 : 0));
  fs.writeFileSync(target, rows.map(r => r.line).join(LF) + LF);
  console.log(month + ': ' + theirs.length + ' in repo + ' + added + ' new = ' + rows.length + ' rows');
}
