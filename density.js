/* How busy is the first screen, in numbers. Counts what a visitor's eye has to
   sort through before it can rest, and how much of the viewport is content
   versus air. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('file:///' + path.join(__dirname, 'index.html').split(path.sep).join('/'), { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(2500);

  const r = await p.evaluate(() => {
    const vw = innerWidth, vh = innerHeight;
    // visibility:hidden and opacity:0 elements still report a box, so ask the
    // browser whether they are really painted — otherwise a closed panel counts
    // as clutter that nobody can see
    const inView = n => {
      const b = n.getBoundingClientRect();
      if (!(b.width > 0 && b.height > 0 && b.top < vh && b.bottom > 0 && b.left < vw && b.right > 0)) return false;
      if (n.checkVisibility) return n.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
      return true;
    };

    const bar = document.querySelector('.bar-main');
    const barControls = bar ? [...bar.querySelectorAll('button, a, input, select')].filter(inView).length : 0;
    const chips = [...document.querySelectorAll('.rail .chip')].filter(inView).length;
    const clickable = [...document.querySelectorAll('a, button, input, [role=button]')].filter(inView).length;
    const textNodes = [...document.querySelectorAll('h1,h2,h3,p,span,b,i,label,kbd')]
      .filter(n => inView(n) && (n.textContent || '').trim().length > 0 && n.children.length === 0).length;

    // how much of the first screen is covered by something
    const cells = [];
    const step = 20;
    let covered = 0, cellsTotal = 0;
    for (let y = 0; y < vh; y += step) for (let x = 0; x < vw; x += step) {
      cellsTotal++;
      const el = document.elementFromPoint(x + 1, y + 1);
      if (!el) continue;
      const tag = el.tagName;
      if (el.closest('a.card, header, .rail, .sheet-card, .chowk, h2, .made, .keys') && tag !== 'BODY' && tag !== 'HTML') covered++;
    }

    const cards = [...document.querySelectorAll('a.card')];
    const firstRow = cards.filter(c => { const b = c.getBoundingClientRect(); return b.top < vh && b.bottom > 0; });
    const grid = cards[0] ? getComputedStyle(cards[0].parentElement) : null;

    return {
      barControls, chips, clickable, textNodes,
      inkPct: Math.round(covered / cellsTotal * 100),
      cardsInFirstScreen: firstRow.length,
      gridGap: grid ? grid.gap : 'n/a',
      gutter: getComputedStyle(document.documentElement).getPropertyValue('--gutter').trim(),
      headerH: Math.round(document.getElementById('topbar').getBoundingClientRect().height),
      firstCardTop: cards[0] ? Math.round(cards[0].getBoundingClientRect().top) : null,
      docH: document.documentElement.scrollHeight,
      screens: +(document.documentElement.scrollHeight / vh).toFixed(1)
    };
  });

  for (const [k, v] of Object.entries(r)) console.log(k.padEnd(20), v);
  await b.close();
})();
