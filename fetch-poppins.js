/* Downloads the Poppins subsets we need (Devanagari + Latin, 400/500) and
   writes poppins-face.css with the files inlined as data URIs — the artifact
   CSP blocks font CDNs, so the page has to carry its own typography. */
const fs = require('fs'), path = require('path'), https = require('https');

const css = fs.readFileSync(path.join(__dirname, 'poppins.css'), 'utf8');

const get = url => new Promise((res, rej) => {
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126.0' } }, r => {
    const chunks = [];
    r.on('data', c => chunks.push(c));
    r.on('end', () => res(Buffer.concat(chunks)));
  }).on('error', rej);
});

(async () => {
  // split the stylesheet into its @font-face rules and keep only the ranges we use
  const faces = css.split('@font-face').slice(1).map(b => '@font-face' + b.slice(0, b.indexOf('}') + 1));
  const wanted = faces.filter(f => /U\+0900-097F/.test(f) || /U\+0000-00FF/.test(f));

  let out = '/* Poppins (SIL Open Font License) — geometric UI face, inlined */\n';
  for (const f of wanted) {
    const weight = (f.match(/font-weight:\s*(\d+)/) || [])[1];
    if (!['400', '500'].includes(weight)) continue;
    const url = (f.match(/url\((https:[^)]+)\)/) || [])[1];
    const range = (f.match(/unicode-range:\s*([^;]+);/) || [])[1];
    if (!url) continue;
    const buf = await get(url);
    out += '@font-face{font-family:"Poppins";font-style:normal;font-weight:' + weight + ';font-display:swap;' +
      'src:url(data:font/woff2;base64,' + buf.toString('base64') + ') format("woff2");' +
      'unicode-range:' + range.trim() + ';}\n';
    console.log('  packed', weight, range.slice(0, 16) + '…', Math.round(buf.length / 1024) + 'kb');
  }

  fs.writeFileSync(path.join(__dirname, 'poppins-face.css'), out);
  console.log('poppins-face.css —', Math.round(out.length / 1024) + 'kb');
})();
