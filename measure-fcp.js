/* First paint plus whether the masthead box changes size after it. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1892, height: 894 } });
  await p.goto('file:///' + path.join(__dirname, 'index.html').split(path.sep).join('/'), { waitUntil: 'commit' });
  const t0 = Date.now();
  const widths = new Set();
  while (Date.now() - t0 < 4000) {
    const w = await p.evaluate(() => {
      const t = document.getElementById('ticker');
      return t ? Math.round(t.getBoundingClientRect().width) : null;
    }).catch(() => null);
    if (w) widths.add(w);
    await new Promise(r => setTimeout(r, 60));
  }
  const paint = await p.evaluate(() => {
    const e = performance.getEntriesByType('paint').find(x => x.name === 'first-contentful-paint');
    return e ? Math.round(e.startTime) : -1;
  });
  console.log('FCP: ' + paint + 'ms');
  console.log('distinct ticker widths after load: ' + widths.size + '  ' + [...widths].sort((a, c) => a - c).join(', '));
  await b.close();
})();
