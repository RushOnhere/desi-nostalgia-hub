/* Dumps every number-with-label a site shows, so we can tell a LIVE count
   ("12 listening now") from a CUMULATIVE one ("3,027 have passed through").
   Ranking one against the other is meaningless. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');

const TARGETS = process.argv.slice(2).length ? process.argv.slice(2) : [
  'gali-fm.vercel.app',
  'akhileshbhaiya.lovable.app',
  'deluxesaloon.space',
  'hornokplease.xyz',
  'wohdin.xyz',
  'marathi-songs.vercel.app',
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.route('**/*', r => r.request().resourceType() === 'media' ? r.abort() : r.continue());

  for (const key of TARGETS) {
    const page = await ctx.newPage();
    try {
      await page.goto('https://' + key, { waitUntil: 'domcontentloaded', timeout: 40000 });
      await page.waitForTimeout(6000);

      const found = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('body *').forEach(el => {
          if (el.children.length > 3) return;
          const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (!t || t.length > 80 || !/\d/.test(t)) return;
          if (!/\d[\d,]*/.test(t)) return;
          const r = el.getBoundingClientRect();
          if (!r.width || r.top > 900) return;
          out.push({ text: t, top: Math.round(r.top) });
        });
        // de-dupe nested repeats
        const seen = new Set();
        return out.filter(o => { const k = o.text; if (seen.has(k)) return false; seen.add(k); return true; })
                  .sort((a, b) => a.top - b.top).slice(0, 14);
      });

      console.log('\n=== ' + key);
      found.forEach(f => console.log('   y=' + String(f.top).padStart(4), f.text));
    } catch (e) {
      console.log('\n=== ' + key, 'FAIL', e.message.split('\n')[0].slice(0, 60));
    }
    await page.close();
  }
  await browser.close();
})();
