/* Renders every preview into a labelled grid image so all 65 can be eyeballed
   at once, instead of trusting a brightness heuristic. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const fs = require('fs'), path = require('path');

const shots = JSON.parse(fs.readFileSync(path.join(__dirname, 'shots.json'), 'utf8'));
const keys = Object.keys(shots).sort();
const COLS = 5, CELL_W = 360, CELL_H = 250;

const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#111;font:12px system-ui;color:#ddd}
.g{display:grid;grid-template-columns:repeat(${COLS},${CELL_W}px)}
.c{width:${CELL_W}px;height:${CELL_H}px;padding:6px;box-sizing:border-box}
.c img{width:100%;height:196px;object-fit:cover;object-position:50% 0;display:block;border:1px solid #333}
.c b{display:block;margin-top:6px;font-weight:500;font-size:12px;color:#9fd}
.n{color:#666}
</style><div class="g">
${keys.map((k, i) => `<div class="c"><img src="${shots[k]}"><b><span class="n">${i + 1}.</span> ${k}</b></div>`).join('')}
</div>`;

(async () => {
  const b = await chromium.launch();
  const rows = Math.ceil(keys.length / COLS);
  const p = await b.newPage({ viewport: { width: COLS * CELL_W, height: Math.ceil(keys.length / COLS) * CELL_H } });
  await p.setContent(html, { waitUntil: 'load' });
  await p.waitForTimeout(2500);

  const total = rows * CELL_H;
  const chunk = Math.ceil(rows / 3) * CELL_H;
  for (let i = 0; i < 3; i++) {
    const y = i * chunk;
    if (y >= total) break;
    await p.screenshot({
      path: path.join(__dirname, 'sheet-' + (i + 1) + '.png'),
      clip: { x: 0, y, width: COLS * CELL_W, height: Math.min(chunk, total - y) },
      fullPage: true,
    });
  }
  console.log('contact sheet written:', keys.length, 'previews across 3 images');
  await b.close();
})();
