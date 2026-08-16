/* Reads every captured screenshot and pulls the two colours that actually
   define that site, so the UI can take on each tab's own vibe.
   Writes palette.js -> window.PALETTE = { domain: { a, b, ink } }        */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const fs = require('fs'), path = require('path');

const shots = JSON.parse(fs.readFileSync(path.join(__dirname, 'shots.json'), 'utf8'));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');

  const palette = await page.evaluate(async (shots) => {
    const c = document.getElementById('c');
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const W = 96, H = 60;
    c.width = W; c.height = H;

    const rgb2hsl = (r, g, b) => {
      r /= 255; g /= 255; b /= 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
      let h = 0;
      if (d) {
        if (mx === r) h = ((g - b) / d) % 6;
        else if (mx === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60; if (h < 0) h += 360;
      }
      const l = (mx + mn) / 2;
      const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
      return [h, s, l];
    };
    const hsl2hex = (h, s, l) => {
      const a = s * Math.min(l, 1 - l);
      const f = n => {
        const k = (n + h / 30) % 12;
        const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
        return Math.round(255 * v).toString(16).padStart(2, '0');
      };
      return '#' + f(0) + f(8) + f(4);
    };

    const load = src => new Promise(res => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });

    const out = {};
    for (const [domain, src] of Object.entries(shots)) {
      const im = await load(src);
      if (!im) continue;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(im, 0, 0, W, H);
      const d = ctx.getImageData(0, 0, W, H).data;

      // 24 hue buckets, weighted by saturation and mid lightness — the colours
      // a person would name if asked "what colour is this site?"
      const buckets = new Array(24).fill(null).map(() => ({ w: 0, h: 0, s: 0, l: 0, n: 0 }));
      let lightSum = 0, px = 0;
      for (let i = 0; i < d.length; i += 4) {
        const [h, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
        lightSum += l; px++;
        if (l < 0.08 || l > 0.95 || s < 0.12) continue;   // ignore black bars, blowouts, greys
        const weight = s * (1 - Math.abs(l - 0.5) * 1.1);
        const b = buckets[Math.floor(h / 15) % 24];
        b.w += weight; b.h += h * weight; b.s += s * weight; b.l += l * weight; b.n++;
      }
      const ranked = buckets.filter(b => b.n > 12).sort((x, y) => y.w - x.w);
      const pick = b => {
        const h = b.h / b.w, s = Math.min(0.92, Math.max(0.45, b.s / b.w * 1.25));
        const l = Math.min(0.68, Math.max(0.44, b.l / b.w * 1.15));
        return { hex: hsl2hex(h, s, l), h: Math.round(h) };
      };

      const first = ranked[0] ? pick(ranked[0]) : { hex: '#c9a227', h: 42 };
      // second colour must be a genuinely different hue, else derive a companion
      const alt = ranked.slice(1).find(b => {
        const h = b.h / b.w;
        const diff = Math.abs(h - first.h);
        return Math.min(diff, 360 - diff) > 40;
      });
      const second = alt ? pick(alt) : { hex: hsl2hex((first.h + 42) % 360, .6, .5), h: (first.h + 42) % 360 };

      out[domain] = { a: first.hex, b: second.hex, h: first.h, dark: (lightSum / px) < 0.42 };
    }
    return out;
  }, shots);

  fs.writeFileSync(path.join(__dirname, 'palette.js'), 'window.PALETTE = ' + JSON.stringify(palette, null, 0) + ';\n');
  console.log(Object.keys(palette).length, 'palettes');
  for (const [k, v] of Object.entries(palette)) console.log(k.padEnd(36), v.a, v.b, 'h' + v.h, v.dark ? 'dark' : 'light');
  await browser.close();
})();
