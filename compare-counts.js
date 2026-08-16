/* Compares two count snapshots. If a site's number never moves between scrapes
   it is almost certainly a hard-coded or seeded figure rather than live traffic. */
const fs = require('fs'), path = require('path');
const read = f => {
  const src = fs.readFileSync(path.join(__dirname, f), 'utf8');
  return JSON.parse(src.replace(/^window\.CROWD = /, '').replace(/;\s*$/, ''));
};
const a = read('crowd-1058.js.bak');
const b = read('crowd.js');

const keys = [...new Set([...Object.keys(a.sites), ...Object.keys(b.sites)])];
const rows = [];
for (const k of keys) {
  const x = a.sites[k], y = b.sites[k];
  if (!x && !y) continue;
  rows.push({ k, before: x ? x.n : null, after: y ? y.n : null });
}
const both = rows.filter(r => r.before != null && r.after != null);
const moved = both.filter(r => r.before !== r.after);
const same = both.filter(r => r.before === r.after);

const mins = Math.round((new Date(b.checked) - new Date(a.checked)) / 60000);
console.log('snapshot 1:', a.checked, '\nsnapshot 2:', b.checked, '\ngap:', mins, 'minutes\n');
console.log('MOVED (' + moved.length + '/' + both.length + ') — these look live:');
moved.sort((x, y) => Math.abs(y.after - y.before) - Math.abs(x.after - x.before))
     .forEach(r => console.log('  ', r.k.padEnd(38), r.before, '->', r.after, '(' + (r.after > r.before ? '+' : '') + (r.after - r.before) + ')'));
console.log('\nUNCHANGED (' + same.length + ') — static, seeded, or genuinely steady:');
same.forEach(r => console.log('  ', r.k.padEnd(38), r.before));

const only1 = rows.filter(r => r.before != null && r.after == null).map(r => r.k);
const only2 = rows.filter(r => r.before == null && r.after != null).map(r => r.k);
if (only1.length) console.log('\nreadable before, not now:', only1.join(', '));
if (only2.length) console.log('newly readable:', only2.join(', '));
