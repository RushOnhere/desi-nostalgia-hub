/* Captures a real screenshot of every site in the archive and writes
   shots.json — { domain: "data:image/jpeg;base64,..." } — so index.html
   stays a single portable file with no external requests. */
const { chromium } = require('E:\\Claude Stuff\\motion-kit\\node_modules\\playwright');
const fs = require('fs');
const path = require('path');

const SITES = [
  'https://saloon.wtf',
  'https://deluxesaloon.space',
  'https://pan-wala.vercel.app',
  'https://apnadhaba.com',
  'https://truckplaylist.wtf',
  'https://hornokplease.xyz',
  'https://hornokplease-delta.vercel.app',
  'https://musafir.vercel.app',
  'https://safar-e-up.vercel.app',
  'https://bihar-parivahan-nigam.vercel.app',
  'https://roadways-wala.ai.studio',
  'https://busdriver.wtf',
  'https://marathi-songs.vercel.app',
  'https://madrasradio.vercel.app',
  'https://kannada2000s.vercel.app',
  'https://naada-blr.vercel.app',
  'https://sindhi-lada.vercel.app',
  'https://gediroute.vercel.app',
  'https://chacharchok.vercel.app',
  'https://mehfil-eosin.vercel.app',
  'https://chaitapri.vercel.app',
  'https://chaiwala.live',
  'https://chai-tapri-nine.vercel.app',
  'https://cutting-chai-xi.vercel.app',
  'https://auto-wala.vercel.app',
  'https://construction-site-lac.vercel.app',
  'https://mazdoor-radio.vercel.app',
  'https://90s-toon.vercel.app',
  'https://wohdin.xyz',
  'https://gali-fm.vercel.app',
];

const key = u => u.replace(/^https?:\/\//, '').replace(/\/$/, '');
const dir = __dirname;
const shotDir = path.join(dir, 'shots');
if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1120, height: 700 },   // 16:10, matches the card
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    reducedMotion: 'no-preference',
  });
  await ctx.route('**/*', r => {
    // never let a preview capture start audio playback
    const t = r.request().resourceType();
    return t === 'media' ? r.abort() : r.continue();
  });

  const shots = {};
  const report = [];

  for (const url of SITES) {
    const k = key(url);
    const page = await ctx.newPage();
    let status = 'ok', note = '';
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
      if (resp && resp.status() >= 400) { status = 'http' + resp.status(); }
      await page.waitForTimeout(5200);                       // let fonts + intro animations settle
      const meta = await page.evaluate(() => ({
        title: document.title,
        text: (document.body ? document.body.innerText : '').trim().length,
        bg: getComputedStyle(document.body).backgroundColor,
      }));
      if (meta.text < 5) { note = 'little text (' + meta.text + ')'; }
      const file = path.join(shotDir, k.replace(/[^a-z0-9.-]/gi, '_') + '.jpg');
      await page.screenshot({ path: file, type: 'jpeg', quality: 62 });
      const b64 = fs.readFileSync(file).toString('base64');
      shots[k] = 'data:image/jpeg;base64,' + b64;
      report.push([k, status, Math.round(b64.length / 1024) + 'kb', meta.title.slice(0, 42), note].join(' | '));
    } catch (e) {
      status = 'FAIL';
      report.push([k, status, e.message.split('\n')[0].slice(0, 90)].join(' | '));
    }
    await page.close();
    console.log(report[report.length - 1]);
  }

  fs.writeFileSync(path.join(dir, 'shots.json'), JSON.stringify(shots));
  fs.writeFileSync(path.join(dir, 'shots.js'), 'window.SHOTS = ' + JSON.stringify(shots) + ';\n');
  const total = Object.values(shots).reduce((a, s) => a + s.length, 0);
  console.log('\nCAPTURED', Object.keys(shots).length, '/', SITES.length, '— payload', (total / 1024 / 1024).toFixed(2), 'MB');
  await browser.close();
})();
