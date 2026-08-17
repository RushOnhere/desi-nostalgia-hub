/* Points every absolute reference at the live home, so link previews resolve.
   X and WhatsApp will not follow a relative og:image — the card renders as a
   grey box with no picture, which is the worst possible first impression in a
   niche where the image is the product.

   Idempotent: it rewrites whatever host is currently in place, so re-running it
   after a rename is safe. Change HOME and run it; do not edit the tags by hand. */
const fs = require('fs');
const path = require('path');

const HOME = 'https://thechowk.vercel.app';

// any host we have ever used, so a rename catches every leftover
const OLD_HOST = /https:\/\/(?:chowk|nostalgiahub|desi-nostalgia-hub|apnachowk|thechowk)\.vercel\.app/g;

const p = f => path.join(__dirname, f);
const log = [];
const note = (file, changed, what) => log.push(file.padEnd(14) + (changed ? what : 'no change'));

// ---- index.html: meta tags ----
let h = fs.readFileSync(p('index.html'), 'utf8');
const hBefore = h;
h = h.replace(OLD_HOST, HOME);
h = h.replace('<meta property="og:image" content="/og.png" />',
              '<meta property="og:image" content="' + HOME + '/og.png" />');
h = h.replace('<meta name="twitter:image" content="/og.png" />',
              '<meta name="twitter:image" content="' + HOME + '/og.png" />');
if (!/og:url/.test(h)) {
  h = h.replace('<meta property="og:type" content="website" />',
    '<meta property="og:type" content="website" />\n<meta property="og:url" content="' + HOME + '/" />');
}
if (!/rel="canonical"/.test(h)) {
  h = h.replace('<title>', '<link rel="canonical" href="' + HOME + '/" />\n<title>');
}
fs.writeFileSync(p('index.html'), h);
note('index.html', h !== hBefore, 'og:image, twitter:image, og:url, canonical');

// ---- badge.js: the link makers' visitors click back through ----
let b = fs.readFileSync(p('badge.js'), 'utf8');
const bBefore = b;
b = b.replace(/home:\s*'[^']*'/, "home: '" + HOME + "'");
fs.writeFileSync(p('badge.js'), b);
note('badge.js', b !== bBefore, 'CFG.home');

// ---- sitemap.xml ----
let m = fs.readFileSync(p('sitemap.xml'), 'utf8');
const mBefore = m;
m = m.replace(/<loc>[^<]*<\/loc>/, '<loc>' + HOME + '/</loc>');
fs.writeFileSync(p('sitemap.xml'), m);
note('sitemap.xml', m !== mBefore, 'loc');

// ---- robots.txt ----
let r = fs.readFileSync(p('robots.txt'), 'utf8');
const rBefore = r;
r = /Sitemap:/i.test(r)
  ? r.replace(/Sitemap:.*/i, 'Sitemap: ' + HOME + '/sitemap.xml')
  : r.trimEnd() + '\nSitemap: ' + HOME + '/sitemap.xml\n';
fs.writeFileSync(p('robots.txt'), r);
note('robots.txt', r !== rBefore, 'sitemap line');

// ---- docs ----
for (const doc of ['README.md', 'CONTEXT.md']) {
  let d = fs.readFileSync(p(doc), 'utf8');
  const dBefore = d;
  d = d.replace(OLD_HOST, HOME);
  fs.writeFileSync(p(doc), d);
  note(doc, d !== dBefore, 'host references');
}

console.log(log.join('\n'));
console.log('\nhome is now ' + HOME);
