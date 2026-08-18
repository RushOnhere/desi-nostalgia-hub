/* A favicon from the real mark: the monogram on the same black tile the
   masthead uses, so the browser tab, the masthead and the footer are all
   obviously the same thing. Written as a PNG at three sizes plus an apple
   touch icon — an SVG cannot carry the artwork. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const fs = require('fs'), path = require('path');

const logo = fs.readFileSync(path.join(__dirname, 'logo.js'), 'utf8');
const MARK = JSON.parse(logo.match(/window\.LOGO = (\{[\s\S]*?\});/)[1]);

const SIZES = [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png'], [512, 'icon-512.png']];

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setContent('<canvas id="c"></canvas>');

  for (const [size, name] of SIZES) {
    const data = await p.evaluate(async ({ src, size }) => {
      const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
      const c = document.getElementById('c'), ctx = c.getContext('2d');
      c.width = c.height = size;
      // the tile, with the same corner radius as the masthead badge
      const r = size * 0.22;
      ctx.fillStyle = '#07080c';
      ctx.beginPath();
      ctx.moveTo(r, 0); ctx.arcTo(size, 0, size, size, r); ctx.arcTo(size, size, 0, size, r);
      ctx.arcTo(0, size, 0, 0, r); ctx.arcTo(0, 0, size, 0, r); ctx.closePath(); ctx.fill();
      // the mark, contained with a little air
      const pad = size * 0.1, box = size - pad * 2;
      const scale = Math.min(box / im.naturalWidth, box / im.naturalHeight);
      const w = im.naturalWidth * scale, h = im.naturalHeight * scale;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(im, (size - w) / 2, (size - h) / 2, w, h);
      return c.toDataURL('image/png');
    }, { src: MARK.url, size });

    fs.writeFileSync(path.join(__dirname, name), Buffer.from(data.split(',')[1], 'base64'));
    console.log(name.padEnd(22) + Math.round(fs.statSync(path.join(__dirname, name)).size / 1024) + ' KB');
  }
  await b.close();
})();
