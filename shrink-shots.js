/* The captures are 1120px wide but a tile paints at ~370–620px. Decoding 65
   oversized bitmaps was what made scrolling chop, so re-encode them smaller. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const fs = require('fs'), path = require('path');

const W = 900, Q = 0.6;
const shots = JSON.parse(fs.readFileSync(path.join(__dirname, 'shots.json'), 'utf8'));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');

  const before = Object.values(shots).reduce((a, s) => a + s.length, 0);

  const out = await page.evaluate(async ({ shots, W, Q }) => {
    const c = document.getElementById('c');
    const ctx = c.getContext('2d');
    const load = src => new Promise(res => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });
    const result = {};
    for (const [k, src] of Object.entries(shots)) {
      const im = await load(src);
      if (!im) { result[k] = src; continue; }
      if (im.naturalWidth <= W) { result[k] = src; continue; }
      const h = Math.round(im.naturalHeight * (W / im.naturalWidth));
      c.width = W; c.height = h;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(im, 0, 0, W, h);
      const next = c.toDataURL('image/jpeg', Q);
      result[k] = next.length < src.length ? next : src;
    }
    return result;
  }, { shots, W, Q });

  const after = Object.values(out).reduce((a, s) => a + s.length, 0);
  fs.writeFileSync(path.join(__dirname, 'shots.json'), JSON.stringify(out));
  fs.writeFileSync(path.join(__dirname, 'shots.js'), 'window.SHOTS = ' + JSON.stringify(out) + ';\n');
  console.log('images:', Object.keys(out).length,
    '| before', (before / 1024 / 1024).toFixed(2), 'MB',
    '-> after', (after / 1024 / 1024).toFixed(2), 'MB',
    '(' + Math.round((1 - after / before) * 100) + '% smaller)');
  await browser.close();
})();
