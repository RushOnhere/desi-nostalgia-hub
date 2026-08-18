/* Drives the actual form in a browser and checks each outcome against the real
   database: a good submission, a bare domain (people paste those), a junk url,
   a bad handle, and a duplicate. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const path = require('path');

const stamp = Date.now();
const CASES = [
  { name: 'valid',        url: 'https://formtest-' + stamp + '.wtf', handle: 'some_maker', expect: 'good' },
  { name: 'bare domain',  url: 'formtest-bare-' + stamp + '.in',     handle: '',           expect: 'good' },
  { name: 'duplicate',    url: 'https://formtest-' + stamp + '.wtf', handle: '',           expect: 'good' },
  { name: 'junk url',     url: 'not a website',                      handle: '',           expect: 'bad'  },
  { name: 'bad handle',   url: 'https://formtest-h-' + stamp + '.in',handle: 'no spaces!', expect: 'bad'  }
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  await page.goto('file:///' + path.join(__dirname, 'index.html').split(path.sep).join('/'), { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1500);

  // open the sheet the way a visitor does
  await page.click('#submitbtn');
  await page.waitForTimeout(400);
  const visible = await page.isVisible('#s-form');
  console.log('sheet opens with the form visible:', visible);

  let pass = 0;
  for (const c of CASES) {
    await page.fill('#f-url', c.url);
    await page.fill('#f-handle', c.handle);
    await page.fill('#f-note', 'submitted by the test run');
    await page.click('#f-send');
    await page.waitForFunction(() => {
      const m = document.getElementById('f-msg');
      return m.textContent && !/…$/.test(m.textContent);
    }, { timeout: 20000 }).catch(() => {});
    const { text, kind } = await page.evaluate(() => ({
      text: document.getElementById('f-msg').textContent,
      kind: document.getElementById('f-msg').className.replace('f-msg', '').trim()
    }));
    const ok = kind === c.expect;
    if (ok) pass++;
    console.log((ok ? 'ok   ' : 'FAIL ') + c.name.padEnd(13) + '[' + kind + '] ' + text);
    await page.fill('#f-url', '');
  }

  console.log('\njs errors:', errs.length ? errs.slice(0, 3) : 'none');
  console.log(pass + '/' + CASES.length + ' cases behaved');
  await page.screenshot({ path: path.join(__dirname, 'form.png') });
  await browser.close();
})();
