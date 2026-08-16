/* Re-captures the weak previews. Many of these sites open on an "enter" gate —
   a tap-to-start screen — so the first capture caught a black page. This one
   looks for that gate, clicks it, waits for the real UI, then shoots. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const fs = require('fs'), path = require('path');

const list = JSON.parse(fs.readFileSync(path.join(__dirname, 'recapture.json'), 'utf8'));
const shots = JSON.parse(fs.readFileSync(path.join(__dirname, 'shots.json'), 'utf8'));

const ENTER = /(enter|tap|start|begin|play|listen|remote|childhood|board|ride|tune|open|come in|step in|switch on|pick up|सुनिए|सुनो|चलिए|चलो|शुरू|अंदर|प्रवेश|बैठिए|चढ़ें|खोलिए|चालू|கேள்|ప్రారంభ|ಪ್ರಾರಂಭ|શરૂ|শুরু)/i;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1120, height: 700 }, deviceScaleFactor: 1 });
  await ctx.route('**/*', r => r.request().resourceType() === 'media' ? r.abort() : r.continue());

  for (const key of list) {
    const url = 'https://' + key;
    const page = await ctx.newPage();
    let note = '';
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(4500);

      // click an entry gate if there is one
      const clicked = await page.evaluate((src) => {
        const re = new RegExp(src, 'i');
        const cands = [...document.querySelectorAll('button, a, [role=button], .btn, [class*=enter], [class*=start], [class*=play]')];
        for (const el of cands) {
          const t = (el.textContent || '').trim();
          if (!t || t.length > 34) continue;
          if (!re.test(t)) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 40 || r.height < 20 || r.top > 700) continue;
          el.click();
          return t;
        }
        // a full-screen overlay that swallows clicks is also a gate
        const ov = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        if (ov && ov !== document.body && typeof ov.click === 'function') { ov.click(); return '(centre)'; }
        return null;
      }, ENTER.source);
      if (clicked) { note = 'clicked ' + clicked; await page.waitForTimeout(5000); }
      else { await page.waitForTimeout(2500); }

      const file = path.join(__dirname, 'shots', key + '.jpg');
      await page.screenshot({ path: file, type: 'jpeg', quality: 62 });
      shots[key] = 'data:image/jpeg;base64,' + fs.readFileSync(file).toString('base64');
      console.log(key.padEnd(38), 'ok', Math.round(fs.statSync(file).size / 1024) + 'kb', note);
    } catch (e) {
      console.log(key.padEnd(38), 'FAIL', e.message.split('\n')[0].slice(0, 60));
    }
    await page.close();
  }

  fs.writeFileSync(path.join(__dirname, 'shots.json'), JSON.stringify(shots));
  console.log('\nre-captured', list.length, 'sites; run shrink-shots.js next');
  await browser.close();
})();
