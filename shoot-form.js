const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.stack || e.message).split(String.fromCharCode(10)).slice(0, 4).join('  |  ')));
  const url = 'file:///' + path.join(__dirname, 'index.html').split(path.sep).join('/');
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(1200);

  for (const lang of ['hi', 'en']) {
    if (lang === 'en') { await p.click('#lang'); await p.waitForTimeout(500); }
    await p.click('#submitbtn');
    await p.waitForTimeout(500);
    const labels = await p.evaluate(() => ({
      html: document.documentElement.lang,
      l: ['f-url-l', 'f-name-l', 'f-handle-l', 'f-note-l'].map(id => document.getElementById(id).textContent),
      btn: document.querySelector('#f-send .bi b[lang="' + document.documentElement.lang + '"]').textContent
    }));
    console.log(lang + ' (html lang=' + labels.html + '): ' + labels.l.join(' | ') + '   btn: ' + labels.btn);
    const box = await p.locator('.sheet-card').boundingBox();
    await p.screenshot({ path: path.join(__dirname, 'form-' + lang + '.png'), clip: box });
    await p.click('#submit-close');
    await p.waitForTimeout(300);
  }
  console.log('errors: ' + (errs.length ? errs.slice(0, 2).join('  //  ') : 'none'));
  await b.close();
})();
