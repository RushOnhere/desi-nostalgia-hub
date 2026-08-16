/* Finds previews that are missing, blank, or nearly uniform (an "enter" gate,
   a black screen, a loading state) so they can be re-captured properly. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const fs = require('fs'), path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const urls = [...html.matchAll(/u:'(https:\/\/[^']+)'/g)].map(m => m[1]);
const shots = JSON.parse(fs.readFileSync(path.join(__dirname, 'shots.json'), 'utf8'));
const key = u => u.replace(/^https?:\/\//, '').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');

  const stats = await page.evaluate(async (shots) => {
    const c = document.getElementById('c'), ctx = c.getContext('2d', { willReadFrequently: true });
    const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
    const out = {};
    for (const [k, src] of Object.entries(shots)) {
      const im = await load(src);
      if (!im) { out[k] = null; continue; }
      c.width = 64; c.height = 40;
      ctx.drawImage(im, 0, 0, 64, 40);
      const d = ctx.getImageData(0, 0, 64, 40).data;
      let sum = 0, sum2 = 0, n = 0, dark = 0;
      for (let i = 0; i < d.length; i += 4) {
        const l = (d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114);
        sum += l; sum2 += l * l; n++;
        if (l < 24) dark++;
      }
      const mean = sum / n;
      out[k] = { mean: +mean.toFixed(1), sd: +Math.sqrt(sum2 / n - mean * mean).toFixed(1), darkPct: +(dark / n * 100).toFixed(0) };
    }
    return out;
  }, shots);

  const missing = urls.filter(u => !shots[key(u)]);
  const weak = Object.entries(stats)
    .filter(([, s]) => s && (s.sd < 26 || s.darkPct > 62 || s.mean < 16))
    .sort((a, b) => a[1].sd - b[1].sd);

  console.log('MISSING (' + missing.length + '):');
  missing.forEach(u => console.log('  ', key(u)));
  console.log('\nWEAK / FLAT (' + weak.length + '):');
  weak.forEach(([k, s]) => console.log('  ', k.padEnd(38), 'sd=' + s.sd, 'dark=' + s.darkPct + '%', 'mean=' + s.mean));

  fs.writeFileSync(path.join(__dirname, 'recapture.json'),
    JSON.stringify([...missing.map(key), ...weak.map(w => w[0])]));
  console.log('\n-> recapture.json:', missing.length + weak.length, 'sites');
  await browser.close();
})();
