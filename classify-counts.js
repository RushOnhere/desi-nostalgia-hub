/* Tells a LIVE counter ("1,282 listening now") from a CUMULATIVE one
   ("3,029 have passed through this gali"). Ranking a lifetime odometer against
   concurrent listeners is meaningless — the odometer always wins.

   Two signals:
     1. the wording next to the number
     2. the history: a number that only ever rises is an odometer  */
const fs = require('fs');
const path = require('path');

const TOTAL_WORDS = /(passed through|visitors?|visits?|views|so far|since|total|served|all[- ]time|अब तक|कुल|तक आ चुके)/i;
const LIVE_WORDS = /(listening|online|live|now|on the highway|in the van|aboard|riding|tuned|present|सुन रहे|सुन रही|ऑनलाइन|अभी|यात्री|सवार)/i;

function classify(entry, history) {
  const text = ((entry.raw || '') + ' ' + (entry.label || '')).toLowerCase();

  // some headers carry both ("2 listening now · 204 visitors since May"), so
  // look at the words sitting right after the number we actually captured
  const nStr = String(entry.n);
  const pretty = Number(entry.n).toLocaleString('en-IN');
  const at = [text.indexOf(nStr), text.indexOf(pretty.toLowerCase())].filter(i => i >= 0).sort((a, b) => a - b)[0];
  if (at >= 0) {
    const after = text.slice(at, at + 28);
    if (LIVE_WORDS.test(after) && !TOTAL_WORDS.test(after)) return 'live';
    if (TOTAL_WORDS.test(after) && !LIVE_WORDS.test(after)) return 'total';
  }

  // wording wins when it is unambiguous
  const saysTotal = TOTAL_WORDS.test(text);
  const saysLive = LIVE_WORDS.test(text);
  if (saysTotal && !saysLive) return 'total';
  if (saysLive && !saysTotal) return 'live';

  // otherwise look at the shape of the history
  const reads = (history || []).map(r => r.n);
  if (reads.length >= 4) {
    let ups = 0, downs = 0;
    for (let i = 1; i < reads.length; i++) {
      if (reads[i] > reads[i - 1]) ups++;
      else if (reads[i] < reads[i - 1]) downs++;
    }
    if (ups >= 3 && downs === 0) return 'total';   // only ever climbs
    if (downs > 0) return 'live';                   // goes up and down
  }
  return saysTotal ? 'total' : 'live';
}

module.exports = { classify };

// running it directly re-classifies the current crowd.js in place
if (require.main === module) {
  const dir = __dirname;
  const crowd = JSON.parse(fs.readFileSync(path.join(dir, 'crowd.js'), 'utf8')
    .replace(/^window\.CROWD = /, '').replace(/;\s*$/, ''));
  const hist = fs.existsSync(path.join(dir, 'crowd-history.json'))
    ? JSON.parse(fs.readFileSync(path.join(dir, 'crowd-history.json'), 'utf8')) : {};

  const totals = [], lives = [];
  for (const [k, v] of Object.entries(crowd.sites)) {
    if (!v) continue;
    v.kind = classify(v, hist[k]);
    (v.kind === 'total' ? totals : lives).push([k, v.n, v.raw]);
  }

  crowd.trustedTotal = Object.values(crowd.sites)
    .filter(v => v && v.kind === 'live' && v.moved !== false)
    .reduce((a, v) => a + v.n, 0);

  fs.writeFileSync(path.join(dir, 'crowd.js'), 'window.CROWD = ' + JSON.stringify(crowd) + ';\n');

  console.log('CUMULATIVE — shown, but never ranked as "right now" (' + totals.length + '):');
  totals.sort((a, b) => b[1] - a[1]).forEach(([k, n, raw]) => console.log('  ', k.padEnd(34), String(n).padStart(6), ' "' + (raw || '').slice(0, 42) + '"'));
  console.log('\nLIVE — these are the real busiest (' + lives.length + '), top 8:');
  lives.sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([k, n, raw]) => console.log('  ', k.padEnd(34), String(n).padStart(6), ' "' + (raw || '').slice(0, 42) + '"'));
  console.log('\ntrusted live total:', crowd.trustedTotal.toLocaleString('en-IN'));
}
