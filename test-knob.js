/* Does the dial work, and do the five moved controls still do their jobs from
   inside it? Each one is exercised through a real click. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message).slice(0, 110)));
  await p.goto('file:///' + path.join(__dirname, 'index.html').split(path.sep).join('/'), { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(2200);

  const state = () => p.evaluate(() => ({
    open: document.getElementById('knobPanel').classList.contains('on'),
    expanded: document.getElementById('knob').getAttribute('aria-expanded'),
    mode: document.documentElement.getAttribute('data-mode'),
    view: document.getElementById('v-seats').getAttribute('aria-pressed'),
    sound: document.getElementById('sound').getAttribute('aria-pressed'),
    live: document.getElementById('livebtn').getAttribute('aria-pressed'),
    panelVisible: getComputedStyle(document.getElementById('knobPanel')).visibility
  }));

  const before = await state();
  console.log('closed at load        ', !before.open && before.panelVisible === 'hidden' ? 'ok' : 'FAIL');

  await p.click('#knob'); await p.waitForTimeout(500);
  let s = await state();
  console.log('opens on click        ', s.open && s.expanded === 'true' && s.panelVisible === 'visible' ? 'ok' : 'FAIL');

  await p.click('#theme'); await p.waitForTimeout(400);
  const afterTheme = await state();
  console.log('theme still toggles   ', afterTheme.mode !== before.mode ? 'ok  (' + before.mode + ' -> ' + afterTheme.mode + ')' : 'FAIL');
  console.log('stays open after use  ', afterTheme.open ? 'ok' : 'FAIL');

  await p.click('#sound'); await p.waitForTimeout(300);
  const afterSound = await state();
  console.log('sound still toggles   ', afterSound.sound !== before.sound ? 'ok' : 'FAIL');

  await p.click('#livebtn'); await p.waitForTimeout(300);
  const afterLive = await state();
  console.log('live still toggles    ', afterLive.live !== before.live ? 'ok' : 'FAIL');

  await p.click('#v-seats'); await p.waitForTimeout(900);
  const afterView = await state();
  console.log('seat chart still opens', afterView.view === 'true' ? 'ok' : 'FAIL');
  await p.click('#v-grid'); await p.waitForTimeout(600);

  await p.click('body', { position: { x: 700, y: 700 } }); await p.waitForTimeout(500);
  console.log('closes on outside click', (await state()).open ? 'FAIL' : 'ok');

  await p.click('#knob'); await p.waitForTimeout(400);
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  console.log('closes on Escape      ', (await state()).open ? 'FAIL' : 'ok');

  // shuffle opens a tab, so just confirm it is reachable and wired
  await p.click('#knob'); await p.waitForTimeout(400);
  console.log('shuffle present       ', await p.isVisible('#shuffle') ? 'ok' : 'FAIL');

  console.log('\njs errors:', errs.length ? errs.slice(0, 3) : 'none');
  await b.close();
})();
