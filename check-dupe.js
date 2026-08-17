/* Is the-nostalgia.vercel.app the same project as nostalgiahits.in?
   Both are s4tr2's. If they are one site on two domains, adding both would
   put a duplicate in the archive and double-count its listeners. */
const { chromium } = require('E:/Claude Stuff/motion-kit/node_modules/playwright');

const URLS = ['https://the-nostalgia.vercel.app', 'https://nostalgiahits.in'];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1120, height: 700 } });
  for (const url of URLS) {
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(4000);
      const out = await page.evaluate(() => ({
        final: location.href,
        title: document.title,
        text: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 320),
        songs: [...document.querySelectorAll('li,button,[class*=song],[class*=track]')]
          .map(n => (n.innerText || '').trim()).filter(t => t && t.length < 60).slice(0, 8)
      }));
      console.log('\n=== ' + url);
      console.log('final :', out.final);
      console.log('title :', out.title);
      console.log('text  :', out.text);
      console.log('items :', out.songs.join(' | '));
    } catch (e) {
      console.log('\n=== ' + url + '  FAILED ' + e.message.split('\n')[0]);
    }
    await page.close();
  }
  await browser.close();
})();
