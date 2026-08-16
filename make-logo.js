/* Trims the black margin off Desi.png and writes logo.js — the wordmark as a
   data URI, sized for the masthead (retina) instead of 1672px of mostly black. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const fs = require('fs'), path = require('path');

const src = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, 'Desi.png')).toString('base64');
const TARGET_H = 132;   // ~44px on screen at 3x

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setContent('<canvas id="c"></canvas>');

  const out = await p.evaluate(async ({ src, TARGET_H }) => {
    const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const c = document.getElementById('c'), ctx = c.getContext('2d', { willReadFrequently: true });
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    ctx.drawImage(im, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;

    // find the ink: anything meaningfully brighter than the black ground
    let minX = c.width, minY = c.height, maxX = 0, maxY = 0;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        const l = d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114;
        if (l > 34) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    const pad = 14;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(c.width - 1, maxX + pad); maxY = Math.min(c.height - 1, maxY + pad);
    const w = maxX - minX + 1, h = maxY - minY + 1;

    const o = document.createElement('canvas');
    const scale = TARGET_H / h;
    o.width = Math.round(w * scale); o.height = TARGET_H;
    const octx = o.getContext('2d');
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(im, minX, minY, w, h, 0, 0, o.width, o.height);
    return { url: o.toDataURL('image/png'), w: o.width, h: o.height, cropped: w + 'x' + h, from: im.naturalWidth + 'x' + im.naturalHeight };
  }, { src, TARGET_H });

  fs.writeFileSync(path.join(__dirname, 'logo.js'),
    'window.LOGO = ' + JSON.stringify({ url: out.url, w: out.w, h: out.h }) + ';\n');
  console.log('logo.js —', out.from, '-> cropped', out.cropped, '-> output', out.w + 'x' + out.h,
    '|', Math.round(out.url.length / 1024) + 'kb');
  await b.close();
})();
