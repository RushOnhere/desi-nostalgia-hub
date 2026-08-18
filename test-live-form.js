/* The deployed form, end to end: open the sheet on the real site, send a row,
   confirm the page says it landed. The row is deleted right after. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const marker = 'https://livecheck-' + Date.now() + '.wtf';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('https://thechowk.online/', { waitUntil: 'load', timeout: 90000 });
  await p.waitForTimeout(3000);

  const count = await p.evaluate(() => document.querySelectorAll('a.card').length);
  console.log('cards live      :', count);

  await p.click('#submitbtn');
  await p.waitForTimeout(600);
  await p.fill('#f-url', marker);
  await p.fill('#f-name', 'live check');
  await p.fill('#f-handle', 'rushabh_variya');
  await p.fill('#f-note', 'delete me');
  await p.click('#f-send');
  await p.waitForFunction(() => {
    const m = document.getElementById('f-msg');
    return m.textContent && !/…$/.test(m.textContent);
  }, { timeout: 25000 }).catch(() => {});

  const out = await p.evaluate(() => ({
    text: document.getElementById('f-msg').textContent,
    kind: document.getElementById('f-msg').className.replace('f-msg', '').trim()
  }));
  console.log('form said       :', '[' + out.kind + ']', out.text);
  console.log('js errors       :', errs.length ? errs.slice(0, 3) : 'none');
  console.log('row to delete   :', marker);
  await b.close();
})();
