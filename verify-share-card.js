/* Reads the page's meta tags the way a link unfurler does, checks every URL it
   would have to fetch is absolute, and confirms og.png exists at the right size.
   X drops the image entirely if og:image is relative or the file is over 5 MB. */
const fs = require('fs');
const path = require('path');
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');

const HOME = 'https://chowk.vercel.app';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file:///' + path.join(__dirname, 'index.html').split(path.sep).join('/'),
    { waitUntil: 'domcontentloaded', timeout: 60000 });

  const meta = await page.evaluate(() => {
    const g = sel => (document.querySelector(sel) || {}).content || '';
    return {
      'og:url': g('meta[property="og:url"]'),
      'og:title': g('meta[property="og:title"]'),
      'og:image': g('meta[property="og:image"]'),
      'twitter:card': g('meta[name="twitter:card"]'),
      'twitter:image': g('meta[name="twitter:image"]'),
      'description': g('meta[name="description"]').slice(0, 60),
      canonical: (document.querySelector('link[rel=canonical]') || {}).href || ''
    };
  });
  await browser.close();

  let bad = 0;
  for (const [k, v] of Object.entries(meta)) {
    const needsAbs = /image|url|canonical/.test(k);
    const ok = v && (!needsAbs || v.startsWith('https://'));
    if (!ok) bad++;
    console.log((ok ? 'ok   ' : 'FAIL ') + k.padEnd(15) + (v || '(empty)'));
  }

  const og = path.join(__dirname, 'og.png');
  const kb = Math.round(fs.statSync(og).size / 1024);
  const okSize = kb < 5000;
  if (!okSize) bad++;
  console.log((okSize ? 'ok   ' : 'FAIL ') + 'og.png'.padEnd(15) + kb + ' KB (X limit 5 MB)');

  const stale = Object.values(meta).some(v => /desi-nostalgia-hub|nostalgiahub/.test(v));
  if (stale) bad++;
  console.log((stale ? 'FAIL ' : 'ok   ') + 'old host'.padEnd(15) + (stale ? 'an old URL is still in the meta' : 'none left'));

  console.log('\n' + (bad ? bad + ' PROBLEM(S)' : 'share card is clean — will unfurl once ' + HOME + ' is live'));
})();
