/* Reads the permanent log back. This is the thing that turns a pile of
   readings into something you can put in front of a maker or a sponsor:
   peak concurrent, average, when the peak happened, and how many hours of
   coverage each site has.

   node history-stats.js                 top 15 by peak
   node history-stats.js saloon.wtf      one site, hour by hour
   node history-stats.js --all           every site */
const LF = String.fromCharCode(10);
const fs = require('fs'), path = require('path');

const dir = path.join(__dirname, 'history');
if (!fs.existsSync(dir)) { console.log('no history/ yet — it fills up as the counts bot runs'); process.exit(0); }

const rows = [];
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.ndjson')).sort()) {
  for (const line of fs.readFileSync(path.join(dir, f), 'utf8').split(LF)) {
    if (!line.trim()) continue;
    try { rows.push(JSON.parse(line)); } catch (e) { /* a torn last line, skip it */ }
  }
}
if (!rows.length) { console.log('history/ is empty'); process.exit(0); }

const bySite = {};
for (const r of rows) (bySite[r.d] = bySite[r.d] || []).push(r);

const IST = t => new Date(t).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

const summary = Object.entries(bySite).map(([d, rs]) => {
  const ns = rs.map(r => r.n);
  const peak = Math.max(...ns);
  const peakAt = rs.find(r => r.n === peak).t;
  const first = rs[0].t, last = rs[rs.length - 1].t;
  return {
    d, reads: rs.length, peak, peakAt,
    avg: Math.round(ns.reduce((a, b) => a + b, 0) / ns.length),
    low: Math.min(...ns),
    moved: new Set(ns).size > 1,
    hours: +((new Date(last) - new Date(first)) / 36e5).toFixed(1)
  };
}).sort((a, b) => b.peak - a.peak);

const arg = process.argv[2];

if (arg && arg !== '--all') {
  const site = summary.find(s => s.d.includes(arg));
  if (!site) { console.log('no readings for ' + arg); process.exit(1); }
  console.log(site.d + '   ' + site.reads + ' readings over ' + site.hours + ' hours' + LF);
  console.log('peak ' + site.peak + ' at ' + IST(site.peakAt) + '   average ' + site.avg + '   low ' + site.low + LF);
  for (const r of bySite[site.d]) console.log('  ' + IST(r.t).padEnd(26) + String(r.n).padStart(6));
  process.exit(0);
}

const list = arg === '--all' ? summary : summary.slice(0, 15);
console.log('site'.padEnd(34) + 'peak'.padStart(7) + 'avg'.padStart(7) + 'low'.padStart(7) +
  'reads'.padStart(7) + 'hrs'.padStart(7) + '   peak seen');
console.log('-'.repeat(96));
for (const s of list) {
  console.log(s.d.slice(0, 33).padEnd(34) + String(s.peak).padStart(7) + String(s.avg).padStart(7) +
    String(s.low).padStart(7) + String(s.reads).padStart(7) + String(s.hours).padStart(7) +
    '   ' + (s.moved ? IST(s.peakAt) : 'never moves'));
}
console.log(LF + rows.length + ' readings, ' + Object.keys(bySite).length + ' sites, ' +
  fs.readdirSync(dir).filter(x => x.endsWith('.ndjson')).length + ' month file(s)');
