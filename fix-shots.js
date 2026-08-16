/* Targeted re-capture for the previews that were visibly wrong on the contact
   sheet: a changelog dialog, an unopened landing gate, a black player screen.
   Dismisses any modal first, then opens the gate, then shoots. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const fs = require('fs'), path = require('path');

const TARGETS = [
  'train.hereco.xyz',            // caught a "Version 1.2.9 / Acknowledge" dialog
  '90s-toon.vercel.app',         // stuck on the dark "pick up your remote" landing
  'chai-tapri-nine.vercel.app',  // black screen with a small player
  'musafir.vercel.app',          // dashboard before the ride starts
  'kudimagan.vercel.app',        // mood picker overlay
  'madrasradio.vercel.app',      // mood picker overlay
];

const DISMISS = /(acknowledge|got it|dismiss|close|okay|^ok$|continue|skip|no thanks|later|समझ|ठीक|बंद)/i;
const ENTER = /(enter|tap|start|begin|play|listen|remote|childhood|board|ride|tune|open|come in|step in|switch on|pick up|drive|journey|room|सुनिए|सुनो|चलिए|चलो|शुरू|अंदर|प्रवेश|बैठिए|चढ़ें|खोलिए|चालू|கேள்|ప్రారంభ|ಪ್ರಾರಂಭ|શરૂ|শুরু)/i;

const clickMatching = async (page, source, label) => page.evaluate(({ source, label }) => {
  const re = new RegExp(source, 'i');
  const els = [...document.querySelectorAll('button, a, [role=button], [class*=btn], [class*=card], [class*=mood], [class*=room], [class*=option], li')];
  for (const el of els) {
    const t = (el.textContent || '').trim();
    if (!t || t.length > 40 || !re.test(t)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 36 || r.height < 18 || r.top < -50 || r.top > 720) continue;
    el.click();
    return label + ': ' + t.slice(0, 30);
  }
  return null;
}, { source, label });

(async () => {
  const shots = JSON.parse(fs.readFileSync(path.join(__dirname, 'shots.json'), 'utf8'));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1120, height: 700 }, deviceScaleFactor: 1 });
  await ctx.route('**/*', r => r.request().resourceType() === 'media' ? r.abort() : r.continue());

  for (const key of TARGETS) {
    const page = await ctx.newPage();
    const notes = [];
    try {
      await page.goto('https://' + key, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(4500);

      const dismissed = await clickMatching(page, DISMISS.source, 'dismissed');
      if (dismissed) { notes.push(dismissed); await page.waitForTimeout(1800); }

      const entered = await clickMatching(page, ENTER.source, 'entered');
      if (entered) { notes.push(entered); await page.waitForTimeout(5500); }

      // some gates are just a full-bleed overlay with no words on it
      if (!entered) {
        const tapped = await page.evaluate(() => {
          const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
          if (el && el !== document.body && typeof el.click === 'function') { el.click(); return true; }
          return false;
        });
        if (tapped) { notes.push('tapped centre'); await page.waitForTimeout(5000); }
      }

      const file = path.join(__dirname, 'shots', key + '.jpg');
      await page.screenshot({ path: file, type: 'jpeg', quality: 62 });
      shots[key] = 'data:image/jpeg;base64,' + fs.readFileSync(file).toString('base64');
      console.log(key.padEnd(30), 'ok', Math.round(fs.statSync(file).size / 1024) + 'kb', '|', notes.join(' · ') || 'no gate found');
    } catch (e) {
      console.log(key.padEnd(30), 'FAIL', e.message.split('\n')[0].slice(0, 60));
    }
    await page.close();
  }

  fs.writeFileSync(path.join(__dirname, 'shots.json'), JSON.stringify(shots));
  console.log('\ndone — run shrink-shots.js then contact-sheet.js to check');
  await browser.close();
})();
