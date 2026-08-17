/* Checks the archive against the research report: are the sites and handles it
   names actually in here, credited to the right people, and is anyone credited
   to a handle the research could NOT confirm as a maker? */
const fs = require('fs');
const path = require('path');
const s = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const lines = s.split('\n').filter(l => /\{ t:'.*u:'https:/.test(l));
const sites = lines.map(l => ({
  u: (l.match(/u:'([^']+)'/) || [, ''])[1].replace(/^https?:\/\//, '').replace(/\/$/, ''),
  maker: (l.match(/maker:'([^']*)'/) || [, ''])[1],
  handle: (l.match(/handle:'([^']*)'/) || [, ''])[1],
  mv: /mv:1/.test(l)
}));

// sites the research names, with the maker it attributes them to
const NAMED = {
  'saloon.wtf': 'ybhrdwj',
  'the-nostalgia.vercel.app': 's4tr2',
  'nostalgiahits.in': 's4tr2',
  'garba.jdhruv.workers.dev': 'dhruvtwt_',
  'townbus.vercel.app': 'iamAnish',
  'upsc-pause.wtf': 'jaiswal_adt',
  'theka.wtf': 'undopizza',
  'upbusdriver.wtf': '_ekcuttingchai',
  'digitalbus.me': 'Yash_Shinde_024',
  'telugumuthyalu.in': 'hukumathi',
  'taprifm.xyz': 'parth__kapoor'
};

// handles the research explicitly says NOT to tag — no confirmed site
const UNCONFIRMED_BY_RESEARCH = ['arpitjain1308', 'samirande_', 'KaroorSinh', 'spikeysanju',
  'AnantDadhich6', 'yadavd4631', 'nadeemali001', 'itsharxit', 'shntanuuhere',
  'subhamdartist', 'decodedbysania'];

console.log('=== sites the research names ===');
for (const [dom, who] of Object.entries(NAMED)) {
  const hit = sites.find(x => x.u === dom || x.u.startsWith(dom));
  if (!hit) { console.log('MISSING  ' + dom.padEnd(30) + 'research says @' + who); continue; }
  const ok = hit.handle.toLowerCase() === who.toLowerCase();
  const state = !hit.handle ? 'NO CREDIT' : (ok ? 'matches' : 'MISMATCH  we say @' + hit.handle);
  console.log((ok ? 'ok       ' : 'FIX      ') + dom.padEnd(30) + 'research @' + who.padEnd(18) + state);
}

console.log('\n=== handles we credit that the research could not confirm ===');
const risky = sites.filter(x => x.handle &&
  UNCONFIRMED_BY_RESEARCH.some(h => h.toLowerCase() === x.handle.toLowerCase()));
console.log(risky.length ? risky.map(x => '  ' + x.u + '  -> @' + x.handle + (x.mv ? '  [we mark CONFIRMED]' : '  [unconfirmed]')).join('\n')
  : '  none');

console.log('\n=== credit coverage ===');
const credited = sites.filter(x => x.maker || x.handle);
console.log('sites               ', sites.length);
console.log('with any credit     ', credited.length);
console.log('blank card foot     ', sites.length - credited.length,
  '(' + Math.round((sites.length - credited.length) / sites.length * 100) + '% of the archive)');
console.log('marked confirmed    ', sites.filter(x => x.mv).length);

console.log('\n=== share-card meta ===');
for (const tag of ['og:image', 'twitter:image', 'og:url']) {
  const m = s.match(new RegExp('<meta[^>]*' + tag + '[^>]*>', 'i'));
  console.log(tag.padEnd(15), m ? m[0].replace(/\s+/g, ' ').slice(0, 120) : 'ABSENT');
}
