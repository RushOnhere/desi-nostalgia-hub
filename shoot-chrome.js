/* Top of the page and the footer, in both themes, to see the grid and the
   new wordmark as a visitor would. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const path = require('path');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message).slice(0, 120)));
  await p.goto('file:///' + path.join(__dirname, 'index.html').split(path.sep).join('/'), { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(2500);

  for (const mode of ['dark', 'light']) {
    await p.evaluate(m => document.documentElement.setAttribute('data-mode', m), mode);
    await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(__dirname, 'chrome-top-' + mode + '.png') });
    // content-visibility means the page keeps growing as it renders, so one
    // jump to scrollHeight lands mid-page; walk down until it settles
    for (let i = 0; i < 14; i++) {
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(300);
    }
    await p.evaluate(() => document.querySelector('.foot-mark').scrollIntoView({ block: 'end' }));
    await p.waitForTimeout(1200);
    await p.screenshot({ path: path.join(__dirname, 'chrome-foot-' + mode + '.png') });
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(400);
  }

  const geo = await p.evaluate(() => {
    const w = document.querySelector('.foot-word'), g = document.querySelector('.gridbg');
    const l = document.querySelector('.foot-logo'), bar = document.querySelector('.brand .logo');
    return {
      wordWidth: Math.round(w.getBoundingClientRect().width),
      viewport: window.innerWidth,
      gridPainted: getComputedStyle(g).backgroundImage.split(',').length,
      logoH: Math.round(l.getBoundingClientRect().height),
      barLogo: Math.round(bar.getBoundingClientRect().height) + 'x' + Math.round(bar.getBoundingClientRect().width),
      docScrollW: document.documentElement.scrollWidth
    };
  });
  console.log(JSON.stringify(geo, null, 2));
  console.log('errors:', errs.length ? errs : 'none');
  await b.close();
})();
