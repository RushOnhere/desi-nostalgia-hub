/* Reads the live "online / listening" counter each site prints in its own
   header, and writes crowd.js:
     window.CROWD = { checked: <iso>, sites: { domain: { n, label, raw } } }

   A browser cannot read these numbers cross-origin, so this runs here and the
   page shows the reading together with the time it was taken. Re-run to refresh. */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'E:/Claude Stuff/motion-kit/node_modules/playwright');
const LF = String.fromCharCode(10);   // written through a shell too often to trust an escape
const fs = require('fs'), path = require('path');

const SITES = Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname, 'shots.json'), 'utf8')))
  .map(d => 'https://' + d);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.route('**/*', r => r.request().resourceType() === 'media' ? r.abort() : r.continue());

  const sites = {};
  for (const url of SITES) {
    const key = url.replace(/^https?:\/\//, '');
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(5000);

      const found = await page.evaluate(() => {
        const WORD = /(online|live now|listening|listeners|watching|tuned in|on the highway|riding|aboard|सुन रहे|सुन रही|ऑनलाइन|लोग|यात्री|सफ़र में|में हैं|अभी)/i;
        const cands = [];

        // 1. a container whose text holds BOTH the number and a crowd word
        document.querySelectorAll('body *').forEach(el => {
          if (el.children.length > 4) return;
          const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (!t || t.length > 70 || !/\d/.test(t) || !WORD.test(t)) return;
          const m = t.match(/(\d[\d,]*)\s*[^\d]{0,14}?(online|live now|listening|listeners|watching|tuned in|on the highway|सुन रहे|सुन रही|ऑनलाइन|लोग|यात्री|अभी)/i)
                 || t.match(/(online|live now|listening|listeners|watching|सुन रहे|ऑनलाइन)[^\d]{0,14}(\d[\d,]*)/i);
          if (!m) return;
          const numTok = /\d/.test(m[1] || '') ? m[1] : m[2];
          const labTok = /\d/.test(m[1] || '') ? m[2] : m[1];
          if (!numTok) return;
          const n = parseInt(String(numTok).replace(/,/g, ''), 10);
          if (isNaN(n) || n > 5000000) return;
          const r = el.getBoundingClientRect();
          cands.push({ n, label: String(labTok || '').trim(), raw: t, score: 100 - t.length + (r.top < 160 ? 40 : 0) });
        });

        if (cands.length) return cands.sort((a, b) => b.score - a.score)[0];

        // 2. fallback: a bare number sitting in the top strip, once clocks,
        //    dates, temperatures and number plates are ruled out
        const junk = /(\d{1,2}:\d{2})|°|(\b[A-Z]{2}[- ]?\d{1,2}\b)|#\d+|NH-|shift/i;
        const tops = [];
        document.querySelectorAll('body *').forEach(el => {
          if (el.children.length) return;
          const t = (el.textContent || '').trim();
          const r = el.getBoundingClientRect();
          if (r.top > 150 || r.width === 0 || !t || t.length > 12) return;
          if (junk.test(t)) return;
          if (!/^\d[\d,]*$/.test(t)) return;
          const n = parseInt(t.replace(/,/g, ''), 10);
          if (isNaN(n) || n === 0) return;
          // keep the surrounding wording — "3,029 have passed through this gali"
          // means something completely different from "1,282 listening now"
          let ctx = t;
          for (let p = el.parentElement, hops = 0; p && hops < 3; p = p.parentElement, hops++) {
            const pt = (p.textContent || '').replace(/\s+/g, ' ').trim();
            if (pt.length > t.length && pt.length < 120) { ctx = pt; break; }
          }
          // a bare number sitting inside a clock is a clock, not a crowd
          if (/\d{1,2}:\d{2}/.test(ctx) || /\b(am|pm)\b/i.test(ctx) || junk.test(ctx)) return;
          // and it has to be explained by something — a lone digit means nothing
          if (!/[a-zऀ-ॿ]{3}/i.test(ctx)) return;
          tops.push({ n, label: '', raw: ctx, score: 10 });
        });
        return tops.length ? tops[0] : null;
      });

      sites[key] = found ? { n: found.n, label: found.label, raw: found.raw } : null;
      console.log(key.padEnd(36), found ? String(found.n).padStart(6) + '  ' + (found.label || '(bare)') + '   [' + found.raw.slice(0, 46) + ']' : '—');
    } catch (e) {
      sites[key] = null;
      console.log(key.padEnd(36), 'FAIL', e.message.split('\n')[0].slice(0, 60));
    }
    await page.close();
  }

  // keep a rolling history so a counter that never moves can be spotted and
  // marked, instead of quietly inflating the leaderboard
  const HIST = path.join(__dirname, 'crowd-history.json');
  const KEEP = 24;
  const hist = fs.existsSync(HIST) ? JSON.parse(fs.readFileSync(HIST, 'utf8')) : {};
  const now = new Date().toISOString();
  for (const [k, v] of Object.entries(sites)) {
    if (!v) continue;
    hist[k] = (hist[k] || []).concat({ t: now, n: v.n }).slice(-KEEP);
  }
  fs.writeFileSync(HIST, JSON.stringify(hist));

  const { classify } = require('./classify-counts');
  for (const [k, v] of Object.entries(sites)) {
    if (!v) continue;
    v.kind = classify(v, hist[k]);
  }

  let frozen = 0;
  for (const [k, v] of Object.entries(sites)) {
    if (!v) continue;
    const rd = hist[k] || [];
    // needs at least three readings before we are willing to call it static
    v.reads = rd.length;
    v.moved = rd.length < 3 ? null : new Set(rd.map(x => x.n)).size > 1;
    if (v.moved === false) frozen++;
  }

  /* the permanent record. the window above forgets; this does not. one line
     per site per reading, appended, in a file per month. Written after the
     classifier and the frozen check so each row carries what kind of number it
     was and whether that counter had moved, which is the part that makes the
     log worth keeping. */
  const logDir = path.join(__dirname, 'history');
  fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, now.slice(0, 7) + '.ndjson');
  const logRows = Object.entries(sites)
    .filter(([, v]) => v)
    .map(([k, v]) => JSON.stringify({ t: now, d: k, n: v.n, k: v.kind || null, m: v.moved }));
  if (logRows.length) fs.appendFileSync(logFile, logRows.join(LF) + LF);
  console.log('logged ' + logRows.length + ' readings to history/' + now.slice(0, 7) + '.ndjson');

  // only concurrent counters that have been seen to move feed the headline
  const trustedTotal = Object.values(sites)
    .filter(v => v && v.kind === 'live' && v.moved !== false)
    .reduce((a, v) => a + v.n, 0);
  const payload = { checked: now, trustedTotal, frozen, sites };
  fs.writeFileSync(path.join(__dirname, 'crowd.js'), 'window.CROWD = ' + JSON.stringify(payload) + ';\n');
  const found = Object.entries(sites).filter(([, v]) => v).sort((a, b) => b[1].n - a[1].n);
  console.log('\nCOUNTS FOUND:', found.length, '/', SITES.length);
  console.log('BUSIEST:', found.slice(0, 5).map(([k, v]) => k + ' ' + v.n).join(' | '));
  console.log('frozen counters:', payload.frozen,
    '| cumulative counters:', Object.values(sites).filter(v => v && v.kind === 'total').length,
    '| trusted live total:', payload.trustedTotal);
  await browser.close();
})();
