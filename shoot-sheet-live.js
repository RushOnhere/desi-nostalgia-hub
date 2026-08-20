/* The sheet as it now ships, both themes, from the live site. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  for (const mode of ['dark', 'light']) {
    const p = await b.newPage({ viewport: { width: 1280, height: 920 }, deviceScaleFactor: 2 });
    await p.goto('https://thechowk.online/', { waitUntil: 'load', timeout: 90000 });
    await p.waitForTimeout(3000);
    await p.evaluate(m => document.documentElement.setAttribute('data-mode', m), mode);
    await p.waitForTimeout(500);
    await p.click('#submitbtn');
    await p.waitForTimeout(900);
    const box = await p.locator('.sheet-card').boundingBox();
    await p.screenshot({ path: path.join(__dirname, 'sheet-' + mode + '.png'),
      clip: { x: box.x - 110, y: box.y - 70, width: box.width + 220, height: box.height + 140 } });
    await p.close();
    console.log('sheet-' + mode + '.png');
  }
  await b.close();
})();
