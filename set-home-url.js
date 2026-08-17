/* Points every absolute reference at the live home, so link previews resolve.
   X and WhatsApp will not follow a relative og:image — the card renders as a
   grey box with no picture, which is the worst possible first impression in a
   niche where the image is the product. */
const fs = require('fs');
const path = require('path');

const HOME = 'https://chowk.vercel.app';
const p = f => path.join(__dirname, f);
const log = [];

// ---- index.html: meta tags + the site count in the share copy ----
let h = fs.readFileSync(p('index.html'), 'utf8');
const before = h;

h = h.replace('<meta property="og:image" content="/og.png" />',
              '<meta property="og:image" content="' + HOME + '/og.png" />');
h = h.replace('<meta name="twitter:image" content="/og.png" />',
              '<meta name="twitter:image" content="' + HOME + '/og.png" />');

// og:url and a canonical were both missing — without og:url X picks its own
if (!/og:url/.test(h)) {
  h = h.replace('<meta property="og:type" content="website" />',
    '<meta property="og:type" content="website" />\n<meta property="og:url" content="' + HOME + '/" />');
}
if (!/rel="canonical"/.test(h)) {
  h = h.replace('<title>', '<link rel="canonical" href="' + HOME + '/" />\n<title>');
}

// the copy still says 86; it is 87 now, and the count is the one number we
// have to be able to defend on demand
h = h.split('content="86 sites, one screen.').join('content="87 sites, one screen.');
h = h.split('content="86 desi nostalgia sites').join('content="87 desi nostalgia sites');

fs.writeFileSync(p('index.html'), h);
log.push('index.html   ' + (h === before ? 'NO CHANGE' : 'og:image, twitter:image, og:url, canonical, 86->87'));

// ---- badge.js: the link makers' visitors click back through ----
let b = fs.readFileSync(p('badge.js'), 'utf8');
const bBefore = b;
b = b.replace(/home:\s*'[^']*'/, "home: '" + HOME + "'");
fs.writeFileSync(p('badge.js'), b);
log.push('badge.js     ' + (b === bBefore ? 'NO CHANGE — check CFG.home by hand' : 'CFG.home -> ' + HOME));

// ---- sitemap.xml ----
if (fs.existsSync(p('sitemap.xml'))) {
  let m = fs.readFileSync(p('sitemap.xml'), 'utf8');
  const mBefore = m;
  m = m.replace(/<loc>[^<]*<\/loc>/, '<loc>' + HOME + '/</loc>');
  m = m.replace(/<lastmod>[^<]*<\/lastmod>/, '<lastmod>' + new Date().toISOString().slice(0, 10) + '</lastmod>');
  fs.writeFileSync(p('sitemap.xml'), m);
  log.push('sitemap.xml  ' + (m === mBefore ? 'NO CHANGE' : 'loc + lastmod'));
}

// ---- robots.txt ----
if (fs.existsSync(p('robots.txt'))) {
  let r = fs.readFileSync(p('robots.txt'), 'utf8');
  const rBefore = r;
  r = /Sitemap:/i.test(r)
    ? r.replace(/Sitemap:.*/i, 'Sitemap: ' + HOME + '/sitemap.xml')
    : r.trimEnd() + '\nSitemap: ' + HOME + '/sitemap.xml\n';
  fs.writeFileSync(p('robots.txt'), r);
  log.push('robots.txt   ' + (r === rBefore ? 'NO CHANGE' : 'sitemap line'));
}

console.log(log.join('\n'));
