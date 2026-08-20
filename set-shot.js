/* Replace one tile's preview with your own image.

     node set-shot.js saloon.wtf  C:\path\to\picture.png
     node set-shot.js saloon.wtf  --auto        re-shoot it from the live site
     node set-shot.js --list                    every domain the archive knows

   The image is resized to the same 700px width and JPEG quality the rest of
   the previews use, so one hand-placed shot cannot bloat the payload. Writes
   shots.json and shots.js, then tells you what to run next. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const fs = require('fs'), path = require('path');

const W = 700, Q = 0.62;
const p = f => path.join(__dirname, f);
const shots = JSON.parse(fs.readFileSync(p('shots.json'), 'utf8'));

/* the archive's own list of domains, so a typo is caught instead of silently
   adding a key nothing will ever read */
const known = fs.readFileSync(p('index.html'), 'utf8')
  .split(/\r?\n/).filter(l => /\{ t:'.*u:'https:/.test(l))
  .map(l => (l.match(/u:'([^']+)'/) || [, ''])[1].replace(/^https?:\/\//, '').replace(/\/$/, ''));

const [arg1, arg2] = process.argv.slice(2);

if (!arg1 || arg1 === '--list') {
  console.log('domains in the archive (' + known.length + '), * = has a preview:\n');
  for (const d of known.sort()) console.log('  ' + (shots[d] ? '*' : ' ') + ' ' + d);
  console.log('\nusage:  node set-shot.js <domain> <image file>');
  console.log('        node set-shot.js <domain> --auto');
  process.exit(0);
}

const domain = arg1.replace(/^https?:\/\//, '').replace(/\/$/, '');
if (!known.includes(domain)) {
  const near = known.filter(d => d.includes(domain.split('.')[0]));
  console.log('"' + domain + '" is not a domain in the archive.');
  if (near.length) console.log('did you mean:  ' + near.join('  '));
  console.log('run  node set-shot.js --list  to see them all');
  process.exit(1);
}
if (!arg2) { console.log('give me an image file, or --auto to re-shoot from the live site'); process.exit(1); }

(async () => {
  const browser = await chromium.launch();
  let src;

  if (arg2 === '--auto') {
    /* Same gate handling as recapture.js: about a dozen of these sites open on
       a "tap to enter" screen, and a plain screenshot catches that instead of
       the site. Click through first, then shoot. */
    const ENTER = /(enter|tap|start|begin|play|listen|remote|childhood|board|ride|tune|open|come in|step in|switch on|pick up|सुनिए|सुनो|चलिए|चलो|शुरू|अंदर|प्रवेश|बैठिए|चढ़ें|खोलिए|चालू|கேள்|ప్రారంభ|ಪ್ರಾರಂಭ|શરૂ|শুরু)/i;
    const ctx = await browser.newContext({ viewport: { width: 1120, height: 700 } });
    await ctx.route('**/*', r => r.request().resourceType() === 'media' ? r.abort() : r.continue());
    const page = await ctx.newPage();
    await page.goto('https://' + domain, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4500);

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
      const ov = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      if (ov && ov !== document.body && typeof ov.click === 'function') { ov.click(); return '(centre)'; }
      return null;
    }, ENTER.source);
    await page.waitForTimeout(clicked ? 5000 : 2500);

    src = 'data:image/png;base64,' + (await page.screenshot()).toString('base64');
    await page.close();
    console.log('shot ' + domain + ' from the live site' + (clicked ? '  — clicked through: ' + clicked : ''));
  } else {
    const file = path.isAbsolute(arg2) ? arg2 : path.join(process.cwd(), arg2);
    if (!fs.existsSync(file)) { console.log('no such file: ' + file); await browser.close(); process.exit(1); }
    const ext = path.extname(file).slice(1).toLowerCase();
    const type = ext === 'jpg' ? 'jpeg' : ext;
    src = 'data:image/' + type + ';base64,' + fs.readFileSync(file).toString('base64');
    console.log('read ' + path.basename(file) + '  (' + Math.round(fs.statSync(file).size / 1024) + ' KB)');
  }

  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');
  const out = await page.evaluate(async ({ src, W, Q }) => {
    const im = await new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('could not decode that image')); i.src = src;
    });
    const c = document.getElementById('c'), ctx = c.getContext('2d');
    const h = Math.round(im.naturalHeight * (W / im.naturalWidth));
    c.width = W; c.height = h;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(im, 0, 0, W, h);
    return { url: c.toDataURL('image/jpeg', Q), w: W, h, from: im.naturalWidth + 'x' + im.naturalHeight };
  }, { src, W, Q });
  await browser.close();

  const had = shots[domain];
  shots[domain] = out.url;
  fs.writeFileSync(p('shots.json'), JSON.stringify(shots));
  fs.writeFileSync(p('shots.js'), 'window.SHOTS = ' + JSON.stringify(shots) + ';\n');

  console.log(out.from + ' -> ' + out.w + 'x' + out.h + '  ' + Math.round(out.url.length / 1024) + ' KB' +
    (had ? '  (replaced a ' + Math.round(had.length / 1024) + ' KB preview)' : '  (new preview)'));
  console.log('\nnext:  node extract-palette.js     the tile colours come from the shot');
  console.log('       node build-artifact.js');
  console.log('       git add shots.js shots.json palette.js && git commit && git push');
})();
