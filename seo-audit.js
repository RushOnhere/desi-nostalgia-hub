/* What a crawler actually gets from thechowk.online. The page builds its tiles
   in JS, so the question that matters is how much survives before scripts run
   and how much exists after. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');

(async () => {
  const raw = await (await fetch('https://thechowk.online/')).text();

  const tag = re => (raw.match(re) || [, '(missing)'])[1];
  console.log('=== what is in the HTML before any JS runs ===');
  console.log('title       :', tag(/<title>([^<]*)<\/title>/));
  console.log('description :', tag(/<meta name="description" content="([^"]*)"/).slice(0, 90));
  console.log('canonical   :', tag(/<link rel="canonical" href="([^"]*)"/));
  console.log('lang        :', tag(/<html[^>]*lang="([^"]*)"/));
  console.log('h1 in source:', (raw.match(/<h1[^>]*>/g) || []).length);
  console.log('h2 in source:', (raw.match(/<h2[^>]*>/g) || []).length);
  console.log('JSON-LD     :', /application\/ld\+json/.test(raw) ? 'present' : 'MISSING');
  console.log('links in src:', (raw.match(/<a [^>]*href="https?:/g) || []).length);
  console.log('img alt=""  :', (raw.match(/alt=""/g) || []).length);

  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('https://thechowk.online/', { waitUntil: 'load', timeout: 90000 });
  await p.waitForTimeout(4000);
  const after = await p.evaluate(() => ({
    h1: [...document.querySelectorAll('h1')].map(n => n.textContent.trim()).slice(0, 3),
    h2: document.querySelectorAll('h2').length,
    links: document.querySelectorAll('a[href^="http"]').length,
    imgs: document.querySelectorAll('img').length,
    imgsWithAlt: [...document.querySelectorAll('img')].filter(i => (i.alt || '').trim()).length,
    words: (document.body.innerText || '').trim().split(/\s+/).length
  }));
  console.log('\n=== after JS runs ===');
  console.log('h1          :', after.h1.length ? after.h1 : 'NONE');
  console.log('h2          :', after.h2);
  console.log('outbound    :', after.links);
  console.log('images      :', after.imgs, '| with alt text:', after.imgsWithAlt);
  console.log('words       :', after.words);
  await b.close();
})();
