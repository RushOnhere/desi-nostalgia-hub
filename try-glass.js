/* Builds the submit sheet two ways over the real page, shoots both, and
   measures contrast from the PIXELS THAT ACTUALLY GET PAINTED — the card uses a
   gradient, so reading backgroundColor lies. Samples a blank patch of card next
   to the label and compares it with the label's own colour. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const fs = require('fs'), path = require('path');

const GLASS = `
.sheet { backdrop-filter: blur(8px) saturate(120%); -webkit-backdrop-filter: blur(8px) saturate(120%);
         background: rgba(4,5,9,.42); }
.sheet-card {
  background: color-mix(in srgb, var(--surface) 34%, transparent) !important;
  backdrop-filter: blur(34px) saturate(180%);
  -webkit-backdrop-filter: blur(34px) saturate(180%);
  border: 1px solid rgba(255,255,255,.16) !important;
  box-shadow: 0 1px 0 rgba(255,255,255,.22) inset,
              0 -1px 0 rgba(255,255,255,.05) inset,
              0 40px 90px -40px rgba(0,0,0,.9) !important;
}
.field input { background: rgba(255,255,255,.07) !important; border-color: rgba(255,255,255,.18) !important; }
`;

const TUNED = `
.sheet { backdrop-filter: blur(8px) saturate(120%); -webkit-backdrop-filter: blur(8px) saturate(120%);
         background: rgba(4,5,9,.42); }
.sheet-card {
  background: color-mix(in srgb, var(--surface) 34%, transparent) !important;
  backdrop-filter: blur(34px) saturate(180%);
  -webkit-backdrop-filter: blur(34px) saturate(180%);
  border: 1px solid rgba(255,255,255,.16) !important;
  box-shadow: 0 1px 0 rgba(255,255,255,.22) inset, 0 40px 90px -40px rgba(0,0,0,.9) !important;
}
:root[data-mode="light"] .sheet-card {
  background: color-mix(in srgb, var(--surface) 78%, transparent) !important;
  border-color: rgba(46,34,22,.14) !important;
}
:root[data-mode="light"] .sheet { background: rgba(30,22,14,.34); }
.field span { color: var(--muted) !important; }
.field input { background: rgba(255,255,255,.07) !important; border-color: rgba(255,255,255,.18) !important; }
:root[data-mode="light"] .field input { background: rgba(255,255,255,.5) !important; border-color: rgba(46,34,22,.16) !important; }
`;

const lum = ([r, g, b]) => {
  const f = c => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
  return .2126 * f(r) + .7152 * f(g) + .0722 * f(b);
};
const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return +(((Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05)).toFixed(2)); };

(async () => {
  const b = await chromium.launch();
  const url = 'file:///' + path.join(__dirname, 'index.html').split(path.sep).join('/');
  const decoder = await b.newPage();

  const avgOf = async (buf) => {
    const dataUri = 'data:image/png;base64,' + buf.toString('base64');
    return decoder.evaluate(async (src) => {
      const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
      const c = document.createElement('canvas');
      c.width = im.naturalWidth; c.height = im.naturalHeight;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let r = 0, g = 0, bl = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; bl += d[i + 2]; n++; }
      return [Math.round(r / n), Math.round(g / n), Math.round(bl / n)];
    }, dataUri);
  };

  const results = [];
  const combos = [];
  for (const mode of ['dark', 'light']) for (const [n, c] of [['applied', null]]) combos.push([mode + '/' + n, c, mode]);
  for (const [name, css, mode] of combos) {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
    await p.goto(url, { waitUntil: 'load', timeout: 60000 });
    await p.evaluate(m => document.documentElement.setAttribute('data-mode', m), mode);
    await p.waitForTimeout(2200);
    if (css) await p.addStyleTag({ content: css });
    await p.click('#submitbtn');
    await p.waitForTimeout(800);

    const geo = await p.evaluate(() => {
      const card = document.querySelector('.sheet-card').getBoundingClientRect();
      const label = document.getElementById('f-url-l').getBoundingClientRect();
      const parse = s => (s.match(/[\d.]+/g) || []).map(Number).slice(0, 3);
      return {
        card: { x: card.x, y: card.y, w: card.width, h: card.height },
        patch: { x: label.right + 14, y: label.top, width: 26, height: Math.max(8, label.height) },
        labelColor: parse(getComputedStyle(document.getElementById('f-url-l')).color),
        titleColor: parse(getComputedStyle(document.getElementById('submit-title')).color)
      };
    });

    const patchBuf = await p.screenshot({ clip: geo.patch });
    const bg = await avgOf(patchBuf);

    await p.screenshot({ path: path.join(__dirname, 'glass-' + name.replace('/', '-') + '.png'),
      clip: { x: geo.card.x - 80, y: geo.card.y - 50, width: geo.card.w + 160, height: geo.card.h + 100 } });

    const blurs = await p.evaluate(() => [...document.querySelectorAll('*')]
      .filter(n => { const s = getComputedStyle(n); return (s.backdropFilter || s.webkitBackdropFilter || 'none') !== 'none'; }).length);

    results.push({ name, bg, label: ratio(geo.labelColor, bg), title: ratio(geo.titleColor, bg), blurs });
    await p.close();
  }

  console.log('theme/look    card bg painted   label contrast   title contrast   blurred surfaces');
  for (const r of results) {
    console.log(r.name.padEnd(14) + ('rgb(' + r.bg.join(',') + ')').padEnd(18) +
      String(r.label).padStart(10) + String(r.title).padStart(17) + String(r.blurs).padStart(19));
  }
  console.log('\nWCAG floor: 4.5 for the small labels, 3.0 for the big title');
  await b.close();
})();
