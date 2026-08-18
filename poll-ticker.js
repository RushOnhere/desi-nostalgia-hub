/* Which part of the ticker resizes during the count-up: the number, the label,
   or the box. Pass "live" to check the deployed site. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const path = require('path');
const target = process.argv[2] === 'live'
  ? 'https://thechowk.online/'
  : 'file:///' + path.join(__dirname, 'index.html').split(path.sep).join('/');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1892, height: 894 } });
  await p.goto(target, { waitUntil: 'commit', timeout: 90000 });
  const t0 = Date.now();
  const boxes = new Set();
  let last = null;
  while (Date.now() - t0 < 4500) {
    const r = await p.evaluate(() => {
      const t = document.getElementById('ticker');
      if (!t) return null;
      return {
        w: +t.getBoundingClientRect().width.toFixed(2),
        num: +(document.getElementById('tick-num') || { getBoundingClientRect: () => ({ width: 0 }) })
          .getBoundingClientRect().width.toFixed(2),
        text: (document.getElementById('tick-num') || {}).textContent || ''
      };
    }).catch(() => null);
    if (r) {
      boxes.add(r.w);
      const key = r.w + '|' + r.num + '|' + r.text;
      if (key !== last) {
        console.log(String(Date.now() - t0).padStart(5) + 'ms  box ' + String(r.w).padStart(7) +
          '  number box ' + String(r.num).padStart(6) + '  showing ' + r.text);
        last = key;
      }
    }
    await new Promise(r2 => setTimeout(r2, 60));
  }
  console.log('\ndistinct pill widths during load: ' + boxes.size + '  [' + [...boxes].join(', ') + ']');
  await b.close();
})();
