/* Trims the black ground off thechowk.png and writes two crops:
   - MARK: the monogram alone, for the masthead. The full lockup is nearly
     square, and at 44px tall "TheChowk" underneath turns to mush; the monogram
     survives the size.
   - FULL: the whole lockup, for the footer, where it gets real room.
   Both are premultiplied against black in the source, so the black is knocked
   out to transparency rather than left as a rectangle sitting on the page. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const fs = require('fs'), path = require('path');

const src = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, 'thechowk.png')).toString('base64');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setContent('<canvas id="c"></canvas>');

  const out = await p.evaluate(async ({ src }) => {
    const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const c = document.getElementById('c'), ctx = c.getContext('2d', { willReadFrequently: true });
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    ctx.drawImage(im, 0, 0);
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const d = img.data;

    const lum = i => d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114;

    // ink bounds of the whole lockup
    const bounds = (y0, y1) => {
      let minX = c.width, minY = c.height, maxX = 0, maxY = 0;
      for (let y = y0; y < y1; y++) for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        if (lum(i) > 40) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      return { minX, minY, maxX, maxY };
    };

    const all = bounds(0, c.height);

    // the wordmark sits in the bottom third; find the gap above it so the
    // monogram can be cut out on its own
    const rowInk = [];
    for (let y = all.minY; y <= all.maxY; y++) {
      let n = 0;
      for (let x = all.minX; x <= all.maxX; x++) if (lum((y * c.width + x) * 4) > 40) n++;
      rowInk.push({ y, n });
    }
    const peak = Math.max(...rowInk.map(r => r.n));
    const mid = all.minY + (all.maxY - all.minY) * 0.55;
    let split = null;
    for (const r of rowInk) if (r.y > mid && r.n < peak * 0.06) { split = r.y; break; }
    const markBottom = split || Math.round(all.minY + (all.maxY - all.minY) * 0.62);
    const mark = bounds(all.minY, markBottom);

    // knock the black ground out to transparency, keeping the glow
    for (let i = 0; i < d.length; i += 4) {
      const l = lum(i);
      // a wide soft ramp keeps the black glow as a grey haze box on a light
      // background, so cut low luminance outright and ramp only the real edge
      d[i + 3] = l < 30 ? 0 : (l < 78 ? Math.round((l - 30) / 48 * 255) : 255);
    }
    ctx.putImageData(img, 0, 0);

    const cut = (bx, targetH, pad) => {
      const minX = Math.max(0, bx.minX - pad), minY = Math.max(0, bx.minY - pad);
      const maxX = Math.min(c.width - 1, bx.maxX + pad), maxY = Math.min(c.height - 1, bx.maxY + pad);
      const w = maxX - minX + 1, h = maxY - minY + 1;
      const o = document.createElement('canvas');
      const scale = targetH / h;
      o.width = Math.round(w * scale); o.height = targetH;
      const octx = o.getContext('2d');
      octx.imageSmoothingQuality = 'high';
      octx.drawImage(c, minX, minY, w, h, 0, 0, o.width, o.height);
      return { url: o.toDataURL('image/png'), w: o.width, h: o.height, cropped: w + 'x' + h };
    };

    return {
      mark: cut(mark, 156, 8),      // ~52px on screen at 3x
      full: cut(all, 420, 12),      // footer
      from: im.naturalWidth + 'x' + im.naturalHeight,
      splitAt: markBottom
    };
  }, { src });

  fs.writeFileSync(path.join(__dirname, 'logo.js'),
    'window.LOGO = ' + JSON.stringify({ url: out.mark.url, w: out.mark.w, h: out.mark.h }) + ';\n' +
    'window.LOGO_FULL = ' + JSON.stringify({ url: out.full.url, w: out.full.w, h: out.full.h }) + ';\n');

  console.log('source        ', out.from);
  console.log('split row     ', out.splitAt);
  console.log('mark  (bar)   ', out.mark.cropped, '->', out.mark.w + 'x' + out.mark.h,
    Math.round(out.mark.url.length / 1024) + 'kb');
  console.log('full  (footer)', out.full.cropped, '->', out.full.w + 'x' + out.full.h,
    Math.round(out.full.url.length / 1024) + 'kb');
  await b.close();
})();
