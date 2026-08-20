/* Every place text sits on a surface, measured against the pixels actually
   painted there. Run after any change to the ground. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');
const path = require('path');
const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
  return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b);
  return +(((Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05)).toFixed(2)); };

(async () => {
  const b = await chromium.launch();
  const dec = await b.newPage();
  const avg = async buf => dec.evaluate(async src => {
    const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let r = 0, g = 0, bl = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; bl += d[i + 2]; n++; }
    return [Math.round(r / n), Math.round(g / n), Math.round(bl / n)];
  }, 'data:image/png;base64,' + buf.toString('base64'));

  for (const mode of ['dark', 'light']) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await p.goto('file:///' + path.join(__dirname, 'index.html').split(path.sep).join('/'), { waitUntil: 'load', timeout: 60000 });
    await p.waitForTimeout(2200);
    await p.evaluate(m => document.documentElement.setAttribute('data-mode', m), mode);
    await p.waitForTimeout(500);

    console.log('\n--- ' + mode + ' ---');
    const spots = [];

    // card title and its one-liner, on a card body
    const cardGeo = await p.evaluate(() => {
      const cards = [...document.querySelectorAll('a.card')];
      const c = cards.find(x => x.querySelector('h3, .c-t')) || cards[1];
      const t = c.querySelector('h3, .c-t');
      const d = c.querySelector('p, .c-d');
      const parse = s => (s.match(/[\d.]+/g) || []).map(Number).slice(0, 3);
      const box = n => { const r = n.getBoundingClientRect(); return { x: r.right + 8, y: r.top + 3, width: 24, height: 9 }; };
      return { title: { patch: box(t), color: parse(getComputedStyle(t).color) },
               desc: d ? { patch: box(d), color: parse(getComputedStyle(d).color) } : null };
    });
    spots.push(['card title', cardGeo.title]);
    if (cardGeo.desc) spots.push(['card one-liner', cardGeo.desc]);

    // the chowk section heading
    const headGeo = await p.evaluate(() => {
      const h = document.querySelector('h2');
      const r = h.getBoundingClientRect();
      const parse = s => (s.match(/[\d.]+/g) || []).map(Number).slice(0, 3);
      return { patch: { x: r.right + 12, y: r.top + 6, width: 26, height: 10 }, color: parse(getComputedStyle(h).color) };
    });
    spots.push(['section heading', headGeo]);

    for (const [name, g] of spots) {
      const bg = await avg(await p.screenshot({ clip: g.patch }));
      console.log('  ' + name.padEnd(18) + 'behind rgb(' + bg.join(',') + ')'.padEnd(6) + '   contrast ' + ratio(g.color, bg));
    }

    // the two glass surfaces
    await p.click('#knob'); await p.waitForTimeout(800);
    const kp = await p.evaluate(() => {
      const rows = [...document.querySelectorAll('.kp-row')];
      const l = rows[rows.length - 1].querySelector('.kp-l').getBoundingClientRect();
      const parse = s => (s.match(/[\d.]+/g) || []).map(Number).slice(0, 3);
      return { patch: { x: l.right + 10, y: l.top + 2, width: 28, height: 10 },
               color: parse(getComputedStyle(rows[rows.length - 1].querySelector('.kp-l')).color) };
    });
    const kpBg = await avg(await p.screenshot({ clip: kp.patch }));
    console.log('  ' + 'dial panel label'.padEnd(18) + 'behind rgb(' + kpBg.join(',') + ')' + '   contrast ' + ratio(kp.color, kpBg));
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);

    await p.click('#submitbtn'); await p.waitForTimeout(800);
    const sh = await p.evaluate(() => {
      const l = document.getElementById('f-url-l');
      const r = l.getBoundingClientRect();
      const parse = s => (s.match(/[\d.]+/g) || []).map(Number).slice(0, 3);
      return { patch: { x: r.right + 14, y: r.top, width: 26, height: Math.max(8, r.height) }, color: parse(getComputedStyle(l).color) };
    });
    const shBg = await avg(await p.screenshot({ clip: sh.patch }));
    console.log('  ' + 'sheet label'.padEnd(18) + 'behind rgb(' + shBg.join(',') + ')' + '   contrast ' + ratio(sh.color, shBg));
    await p.close();
  }
  console.log('\nfloor: 4.5 for body text, 3.0 for large headings');
  await b.close();
})();
