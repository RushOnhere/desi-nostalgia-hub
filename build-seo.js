/* Generates the parts of the page a crawler needs and a browser does not:
   structured data describing the archive as a list, and a plain <noscript>
   copy of that list. Re-run it whenever sites are added.

   Why it matters here: the tiles are built in JavaScript, so the raw HTML a
   crawler fetches carries 3 links where the rendered page carries 161. Google
   renders JS, but Bing, X's unfurler and the LLM crawlers are inconsistent
   about it, and structured data is read without rendering anything at all. */
const fs = require('fs'), path = require('path');
const HOME = 'https://thechowk.online';
const file = path.join(__dirname, 'index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';

/* pull the SITES array out of the page itself, so this can never drift */
const sites = s.split(/\r?\n/).filter(l => /\{ t:'.*u:'https:/.test(l)).map(l => {
  const g = re => (l.match(re) || [, ''])[1];
  return {
    t: g(/ t:'([^']*)'/), u: g(/ u:'([^']*)'/), d: g(/ d:'([^']*)'/),
    te: g(/ te:'([^']*)'/), de: g(/ de:'([^']*)'/),
    maker: g(/ maker:'([^']*)'/), handle: g(/ handle:'([^']*)'/)
  };
});
if (sites.length < 50) throw new Error('only found ' + sites.length + ' sites — parser is wrong');

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- structured data ---------- */
const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': HOME + '/#site',
      url: HOME + '/',
      name: 'The Chowk',
      alternateName: 'द चौक',
      inLanguage: ['hi', 'en'],
      description: 'An archive of ' + sites.length + ' Indian nostalgia websites — solo-built micro-sites that rebuild one corner of desi life with the music that played there — with a live count of how many people are inside each one.'
    },
    {
      '@type': 'CollectionPage',
      '@id': HOME + '/#page',
      url: HOME + '/',
      name: 'The Chowk — every desi nostalgia website in one place',
      isPartOf: { '@id': HOME + '/#site' },
      about: { '@type': 'Thing', name: 'Indian nostalgia websites' },
      mainEntity: { '@id': HOME + '/#list' }
    },
    {
      '@type': 'ItemList',
      '@id': HOME + '/#list',
      name: 'Desi nostalgia websites',
      numberOfItems: sites.length,
      itemListOrder: 'https://schema.org/ItemListUnordered',
      itemListElement: sites.map((x, i) => {
        const item = {
          '@type': 'ListItem',
          position: i + 1,
          url: x.u,
          name: (x.te || x.t),
          description: (x.de || x.d)
        };
        if (x.maker || x.handle) {
          item.item = {
            '@type': 'WebSite', url: x.u, name: (x.te || x.t),
            creator: {
              '@type': 'Person',
              name: x.maker || ('@' + x.handle),
              ...(x.handle ? { url: 'https://x.com/' + x.handle } : {})
            }
          };
        }
        return item;
      })
    }
  ]
};

const ldBlock = '<script type="application/ld+json">' + nl +
  JSON.stringify(ld, null, 1) + nl + '</script>';

/* ---------- the same list, in plain markup ---------- */
const noscript = [
  '<noscript>',
  '  <h2>देसी नॉस्टैल्जिया वेबसाइटें · Desi nostalgia websites</h2>',
  '  <ul>',
  ...sites.map(x => '    <li><a href="' + esc(x.u) + '">' + esc(x.te || x.t) + '</a> — ' +
    esc(x.de || x.d) + (x.handle ? ' (by <a href="https://x.com/' + esc(x.handle) + '">@' + esc(x.handle) + '</a>)' : '') + '</li>'),
  '  </ul>',
  '</noscript>'
].join(nl);

/* ---------- put both in, replacing any previous run ---------- */
const between = (str, startMark, endMark, replacement) => {
  const a = str.indexOf(startMark);
  if (a < 0) return null;
  const b = str.indexOf(endMark, a);
  return str.slice(0, a) + replacement + str.slice(b + endMark.length);
};

const LD_A = '<script type="application/ld+json">', LD_B = '</script>';
s = s.includes(LD_A) ? between(s, LD_A, LD_B, ldBlock)
                     : s.replace('</head>', ldBlock + nl + '</head>');

s = s.includes('<noscript>') ? between(s, '<noscript>', '</noscript>', noscript)
                             : s.replace('<div class="gridbg"', noscript + nl + '<div class="gridbg"');

fs.writeFileSync(file, s);
console.log('sites in the list : ' + sites.length);
console.log('with a creator    : ' + sites.filter(x => x.maker || x.handle).length);
console.log('structured data   : ' + Math.round(JSON.stringify(ld).length / 1024) + ' KB');
console.log('noscript list     : ' + Math.round(noscript.length / 1024) + ' KB');
