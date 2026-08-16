/* Captures screenshots for the URLs listed in new-urls.txt and merges them into
   the existing shots.json / shots.js, leaving already-captured sites untouched. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const fs = require('fs'), path = require('path');

const dir = __dirname;
const shotDir = path.join(dir, 'shots');
if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir);

const shots = JSON.parse(fs.readFileSync(path.join(dir, 'shots.json'), 'utf8'));
const urls = fs.readFileSync(path.join(dir, 'new-urls.txt'), 'utf8')
  .split(/\r?\n/).map(s => s.trim()).filter(Boolean);

const key = u => u.replace(/^https?:\/\//, '').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1120, height: 700 },
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  });
  await ctx.route('**/*', r => r.request().resourceType() === 'media' ? r.abort() : r.continue());

  let ok = 0, fail = [];
  for (const url of urls) {
    const k = key(url);
    if (shots[k]) { console.log(k.padEnd(40), 'already have'); ok++; continue; }
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(5500);
      const title = await page.title();
      const file = path.join(shotDir, k.replace(/[^a-z0-9.-]/gi, '_') + '.jpg');
      await page.screenshot({ path: file, type: 'jpeg', quality: 62 });
      shots[k] = 'data:image/jpeg;base64,' + fs.readFileSync(file).toString('base64');
      ok++;
      console.log(k.padEnd(40), Math.round(fs.statSync(file).size / 1024) + 'kb  ' + title.slice(0, 44));
    } catch (e) {
      fail.push(k);
      console.log(k.padEnd(40), 'FAIL ' + e.message.split('\n')[0].slice(0, 46));
    }
    await page.close();
  }

  fs.writeFileSync(path.join(dir, 'shots.json'), JSON.stringify(shots));
  fs.writeFileSync(path.join(dir, 'shots.js'), 'window.SHOTS = ' + JSON.stringify(shots) + ';\n');
  console.log('\nTOTAL SHOTS:', Object.keys(shots).length, '| new ok:', ok, '| failed:', fail.length ? fail.join(', ') : 'none');
  console.log('payload', (fs.statSync(path.join(dir, 'shots.js')).size / 1024 / 1024).toFixed(2), 'MB');
  await browser.close();
})();
