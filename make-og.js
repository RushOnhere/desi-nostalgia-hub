/* Builds og.png — the card X and WhatsApp show when someone shares the link.
   Uses the real screenshots and the real crowd numbers so the preview is honest. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const fs = require('fs'), path = require('path');

const shots = JSON.parse(fs.readFileSync(path.join(__dirname, 'shots.json'), 'utf8'));
const crowd = JSON.parse(fs.readFileSync(path.join(__dirname, 'crowd.js'), 'utf8')
  .replace(/^window\.CROWD = /, '').replace(/;\s*$/, ''));
const font = fs.readFileSync(path.join(__dirname, 'fonts', 'f737f94c060e53da-s.p.2898l26umxsw_.woff2')).toString('base64');
const fontLatin = fs.readFileSync(path.join(__dirname, 'fonts', 'e3f77e691ca9dca0-s.p.36nw9m0x9jiu9.woff2')).toString('base64');

const total = Object.values(crowd.sites).filter(Boolean).reduce((a, x) => a + x.n, 0);
const top = Object.entries(crowd.sites).filter(([, v]) => v).sort((a, b) => b[1].n - a[1].n).slice(0, 12);
const tiles = top.map(([k]) => shots[k]).filter(Boolean);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:"Rozha One";src:url(data:font/woff2;base64,${font}) format("woff2");unicode-range:U+900-97F,U+200C-200D,U+20B9;}
@font-face{font-family:"Rozha One";src:url(data:font/woff2;base64,${fontLatin}) format("woff2");unicode-range:U+0-FF;}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#06070b;color:#edf0f6;font-family:"Rozha One",serif;overflow:hidden;position:relative}
.mosaic{position:absolute;inset:0;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,1fr);gap:4px;opacity:.5}
.mosaic div{background-size:cover;background-position:50% 25%}
.veil{position:absolute;inset:0;background:
  radial-gradient(85% 70% at 18% 12%,rgba(176,93,49,.55),transparent 62%),
  radial-gradient(70% 60% at 92% 88%,rgba(62,105,163,.45),transparent 66%),
  linear-gradient(0deg,rgba(6,7,11,.97) 26%,rgba(6,7,11,.72) 60%,rgba(6,7,11,.55))}
.wrap{position:absolute;inset:0;padding:64px 430px 64px 70px;display:flex;flex-direction:column;justify-content:flex-end}
.eyebrow{display:flex;align-items:center;gap:12px;font-size:24px;color:#c9b9a3;margin-bottom:18px}
.dot{width:12px;height:12px;border-radius:50%;background:#4ade80;box-shadow:0 0 18px #4ade80}
h1{font-size:88px;line-height:.98;letter-spacing:-.02em;margin-bottom:16px}
.sub{font-size:30px;color:#b9b1a4;line-height:1.4;max-width:620px;text-wrap:balance}
.stats{position:absolute;right:70px;bottom:64px;text-align:right}
.big{font-size:104px;line-height:1;color:#fff}
.cap{font-size:24px;color:#b9b1a4;margin-top:6px}
</style></head><body>
<div class="mosaic">${tiles.map(t => `<div style="background-image:url(${t})"></div>`).join('')}</div>
<div class="veil"></div>
<div class="wrap">
  <div class="eyebrow"><span class="dot"></span> ${Object.values(crowd.sites).filter(Boolean).length} साइटें अपनी गिनती दिखाती हैं</div>
  <h1>द चौक</h1>
  <div class="sub">चाय टपरी, ट्रक रेडियो, रोडवेज़ बस, नब्बे के कार्टून — सब एक स्क्रीन पर।</div>
  <div class="stats"><div class="big">${total.toLocaleString('en-IN')}</div><div class="cap">लोग अभी इन गलियों में</div></div>
</div></body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.setContent(html, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: path.join(__dirname, 'og.png') });
  console.log('og.png written —', Math.round(fs.statSync(path.join(__dirname, 'og.png')).size / 1024) + 'kb',
    '| total', total.toLocaleString('en-IN'), '| tiles', tiles.length);
  await b.close();
})();
