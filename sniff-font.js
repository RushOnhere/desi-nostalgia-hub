/* Finds which Devanagari face the saloon pages set their big title in, and
   saves the actual font files so the hub can use the same one. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const fs = require('fs'), path = require('path');

const dir = path.join(__dirname, 'fonts');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const fontReqs = [];
  ctx.on('response', async r => {
    const u = r.url();
    if (/\.(woff2?|ttf|otf)(\?|$)/i.test(u) || r.request().resourceType() === 'font') {
      try { fontReqs.push({ url: u, body: await r.body() }); } catch {}
    }
  });

  for (const site of ['https://saloon.wtf', 'https://deluxesaloon.space']) {
    const page = await ctx.newPage();
    try {
      await page.goto(site, { waitUntil: 'domcontentloaded', timeout: 40000 });
      await page.waitForTimeout(6000);
      const info = await page.evaluate(() => {
        const seen = [];
        document.querySelectorAll('h1, h2, h3, [class*=title], [class*=head], div, span').forEach(el => {
          const t = (el.textContent || '').trim();
          if (!t || t.length > 30 || el.children.length) return;
          const cs = getComputedStyle(el);
          const size = parseFloat(cs.fontSize);
          if (size < 34) return;
          seen.push({ text: t.slice(0, 24), family: cs.fontFamily, weight: cs.fontWeight, size: Math.round(size) });
        });
        const faces = [...document.styleSheets].flatMap(ss => {
          try { return [...ss.cssRules].filter(r => r.constructor.name === 'CSSFontFaceRule').map(r => r.cssText.slice(0, 220)); }
          catch { return []; }
        });
        return { big: seen.slice(0, 6), faces: faces.slice(0, 12), bodyFont: getComputedStyle(document.body).fontFamily };
      });
      console.log('\n===', site);
      console.log('body font:', info.bodyFont);
      info.big.forEach(b => console.log('  ', b.size + 'px', b.weight, '|', b.family, '|', b.text));
      info.faces.forEach(f => console.log('   @font-face:', f.replace(/\s+/g, ' ')));
    } catch (e) { console.log(site, 'FAIL', e.message.split('\n')[0]); }
    await page.close();
  }

  console.log('\nFONT FILES SEEN:');
  const saved = new Set();
  for (const f of fontReqs) {
    const name = decodeURIComponent(f.url.split('/').pop().split('?')[0]).replace(/[^\w.-]/g, '_');
    if (saved.has(name)) continue;
    saved.add(name);
    fs.writeFileSync(path.join(dir, name), f.body);
    console.log(' ', name, Math.round(f.body.length / 1024) + 'kb', '<-', f.url.slice(0, 90));
  }
  await browser.close();
})();
