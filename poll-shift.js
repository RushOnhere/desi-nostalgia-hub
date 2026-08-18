/* Polls from Node instead of in-page, and names the element that moves.
   CLS said one shift of 0.031 at ~1.9s; this finds which box it was. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const path = require('path');

const WIDTH = +(process.argv[3] || 1892);
const target = process.argv[2] === 'live'
  ? 'file:///' + require('path').join(__dirname,'index.html').split(require('path').sep).join('/')
  : 'file:///' + path.join(__dirname, 'index.html').split(path.sep).join('/');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: WIDTH, height: 894 } });
  await p.goto(target, { waitUntil: 'commit', timeout: 90000 });

  const read = () => p.evaluate(() => {
    const box = sel => { const n = document.querySelector(sel); return n ? Math.round(n.getBoundingClientRect().top) : null; };
    return {
      docH: document.documentElement.scrollHeight,
      header: Math.round((document.getElementById('topbar') || { getBoundingClientRect: () => ({ height: 0 }) }).getBoundingClientRect().height),
      rail: box('.rail'),
      h2: box('h2'),
      card: box('a.card'),
      cards: document.querySelectorAll('a.card').length,
      ticker: (document.getElementById('ticker') || {}).offsetWidth || 0
    };
  }).catch(() => null);

  let last = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 6000) {
    const r = await read();
    if (r) {
      const key = JSON.stringify(r);
      if (key !== last) {
        console.log(String(Date.now() - t0).padStart(5) + 'ms  ' +
          'docH ' + String(r.docH).padStart(6) +
          '  header ' + String(r.header).padStart(3) +
          '  ticker ' + String(r.ticker).padStart(4) +
          '  rail@' + String(r.rail).padStart(4) +
          '  h2@' + String(r.h2).padStart(5) +
          '  card1@' + String(r.card).padStart(5) +
          '  cards ' + String(r.cards).padStart(3));
        last = key;
      }
    }
    await new Promise(r2 => setTimeout(r2, 70));
  }
  await b.close();
})();
