const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await p.goto('https://thechowk.online/', { waitUntil: 'load', timeout: 90000 });
  await p.waitForTimeout(3500);
  await p.screenshot({ path: path.join(__dirname, 'bar-closed.png'), clip: { x: 0, y: 0, width: 1440, height: 110 } });
  await p.click('#knob');
  await p.waitForTimeout(1000);
  await p.screenshot({ path: path.join(__dirname, 'bar-open.png'), clip: { x: 700, y: 0, width: 740, height: 420 } });
  await b.close();
  console.log('shot from the live site');
})();
