/* Which part of the ticker is resizing: the number, the label, or the box. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1892, height: 894 } });
  await p.goto('file:///' + require('path').join(__dirname,'index.html').split(require('path').sep).join('/'), { waitUntil: 'commit', timeout: 90000 });
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < 4500) {
    const r = await p.evaluate(() => {
      const t = document.getElementById('ticker');
      if (!t) return null;
      return {
        w: +t.getBoundingClientRect().width.toFixed(2),
        kids: [...t.children].map(k => k.tagName.toLowerCase() + ':' +
          k.getBoundingClientRect().width.toFixed(2) + ':' + (k.textContent || '').trim().slice(0, 26))
      };
    }).catch(() => null);
    if (r) {
      const key = JSON.stringify(r);
      if (key !== last) { console.log(String(Date.now() - t0).padStart(5) + 'ms  box ' + r.w + '  |  ' + r.kids.join('  |  ')); last = key; }
    }
    await new Promise(r2 => setTimeout(r2, 60));
  }
  await b.close();
})();
