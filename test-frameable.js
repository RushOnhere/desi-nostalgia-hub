/* Can these sites actually be embedded? Checks the headers that block framing
   AND really loads each one in an iframe to see whether it paints. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const fs = require('fs'), path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const urls = [...new Set([...html.matchAll(/u:'(https:\/\/[^']+)'/g)].map(m => m[1]))];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 640 } });
  const page = await ctx.newPage();
  await page.goto('about:blank');

  const results = [];
  for (const url of urls) {
    const key = url.replace(/^https?:\/\//, '');
    let headers = {};
    try {
      const r = await page.request.get(url, { timeout: 25000, maxRedirects: 5 });
      headers = r.headers();
    } catch (e) { /* header fetch may fail while framing still works */ }

    const xfo = headers['x-frame-options'] || '';
    const csp = headers['content-security-policy'] || '';
    const fa = (csp.match(/frame-ancestors[^;]*/i) || [''])[0];
    const headerBlocks = !!xfo || /frame-ancestors/i.test(csp);

    // the real test: put it in an iframe and see if a document paints
    const painted = await page.evaluate(async (src) => {
      return await new Promise(resolve => {
        const f = document.createElement('iframe');
        f.style.cssText = 'width:1000px;height:600px;border:0;position:fixed;left:-3000px';
        f.src = src;
        let done = false;
        const finish = v => { if (!done) { done = true; f.remove(); resolve(v); } };
        f.onload = () => {
          // cross-origin: we cannot read it, but a blocked frame stays about:blank
          try {
            const d = f.contentDocument;
            if (d && d.location.href === 'about:blank') return finish('blank');
          } catch (e) { return finish('loaded'); }   // opaque = it really loaded
          finish('loaded');
        };
        f.onerror = () => finish('error');
        document.body.appendChild(f);
        setTimeout(() => finish('timeout'), 15000);
      });
    }, url);

    const ok = painted === 'loaded' && !headerBlocks;
    results.push({ key, ok, painted, xfo, fa });
    console.log((ok ? 'YES ' : 'no  ') + key.padEnd(38),
      painted.padEnd(8), xfo ? 'XFO:' + xfo : '', fa || '');
  }

  const yes = results.filter(r => r.ok);
  fs.writeFileSync(path.join(__dirname, 'frameable.js'),
    'window.FRAMEABLE = ' + JSON.stringify(yes.map(r => r.key)) + ';\n');
  console.log('\nEMBEDDABLE:', yes.length, '/', results.length);
  console.log('blocked by headers:', results.filter(r => r.xfo || r.fa).map(r => r.key).join(', ') || 'none');
  await browser.close();
})();
