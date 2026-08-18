/* Samples the masthead from first paint for 5s, so a reflow shows as changed
   numbers instead of something to squint at in a video. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const path = require('path');

const WIDTH = +(process.argv[3] || 1536);
const target = process.argv[2] === 'live'
  ? 'https://thechowk.online/'
  : 'file:///' + path.join(__dirname, 'index.html').split(path.sep).join('/');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: WIDTH, height: 860 } });

  await p.addInitScript(() => {
    window.__samples = [];
    const t0 = performance.now();
    const grab = () => {
      const h = document.getElementById('topbar');
      if (h) {
        const bar = h.querySelector('.bar-main');
        const kids = bar ? [...bar.children] : [];
        const tops = [...new Set(kids.map(k => Math.round(k.getBoundingClientRect().top)))].sort((a, c) => a - c);
        window.__samples.push({
          t: Math.round(performance.now() - t0),
          headerH: Math.round(h.getBoundingClientRect().height),
          rows: tops.length,
          logoW: (() => { const l = h.querySelector('.logo'); return l ? Math.round(l.getBoundingClientRect().width) : 0; })(),
          need: bar ? Math.round(bar.scrollWidth) : 0,
          chowkTop: (() => { const c = document.querySelector('.chowk, #chowk, .spot'); return c ? Math.round(c.getBoundingClientRect().top) : -1; })()
        });
      }
      if (performance.now() - t0 < 5000) setTimeout(grab, 60);
    };
    grab();
  });

  await p.goto(target, { waitUntil: 'commit', timeout: 90000 });
  await p.waitForTimeout(5600);

  const s = await p.evaluate(() => window.__samples);
  console.log('samples: ' + s.length);
  let last = null, changes = 0;
  for (const x of s) {
    const key = x.headerH + '|' + x.rows + '|' + x.logoW + '|' + x.chowkTop;
    if (key !== last) {
      console.log(String(x.t).padStart(5) + 'ms   header ' + String(x.headerH).padStart(3) +
        'px   rows ' + x.rows + '   logo ' + String(x.logoW).padStart(3) +
        'px   content needs ' + x.need + 'px   chowk top ' + x.chowkTop);
      if (last !== null) changes++;
      last = key;
    }
  }
  console.log('\n' + changes + ' change(s) at ' + WIDTH + 'px wide');
  await b.close();
})();
