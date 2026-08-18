const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const url = 'file:///' + path.join(__dirname, 'index.html').split(path.sep).join('/');
  for (const w of [1920, 1600, 1440, 1280, 1180, 1024, 820, 600, 390]) {
    const p = await b.newPage({ viewport: { width: w, height: 860 } });
    await p.goto(url, { waitUntil: 'load', timeout: 60000 });
    await p.waitForTimeout(1400);
    const r = await p.evaluate(() => {
      const bar = document.querySelector('.bar-main');
      const doc = document.documentElement;
      const off = [...document.querySelectorAll('#topbar *')].filter(n => {
        const b2 = n.getBoundingClientRect();
        return b2.width > 0 && (b2.right > window.innerWidth + 1 || b2.left < -1);
      }).length;
      return { need: Math.round(bar.scrollWidth), have: Math.round(bar.clientWidth), offscreen: off, hscroll: doc.scrollWidth > doc.clientWidth };
    });
    console.log(String(w).padStart(5) + 'px  bar needs ' + String(r.need).padStart(5) + ' / has ' + String(r.have).padStart(5) +
      '  offscreen ' + String(r.offscreen).padStart(2) + '  page h-scroll: ' + (r.hscroll ? 'YES' : 'no'));
    await p.close();
  }
  await b.close();
})();
