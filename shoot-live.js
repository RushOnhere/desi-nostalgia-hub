/* Screenshots the deployed site — the repo being right does not prove the CDN
   is serving the same thing, and this is the page a launch post points at. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });

  await page.goto('https://thechowk.vercel.app/', { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(5000);

  const state = await page.evaluate(() => ({
    cards: document.querySelectorAll('a.card').length,
    shots: [...document.querySelectorAll('a.card img')].filter(i => i.currentSrc || i.src).length,
    credits: document.querySelectorAll('.maker').length,
    total: (document.querySelector('.total, [class*=total]') || {}).textContent || ''
  }));

  console.log('cards   ', state.cards);
  console.log('previews', state.shots, 'loaded');
  console.log('credits ', state.credits, 'cards carry a maker line');
  console.log('errors  ', errs.length ? errs.slice(0, 4) : 'none');

  await page.screenshot({ path: path.join(__dirname, 'live.png') });
  await browser.close();
  console.log('\nlive.png written');
})();
