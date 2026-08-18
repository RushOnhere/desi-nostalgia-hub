/* Fetches the deployed site the way X's unfurler would: reads the meta off the
   live HTML, then actually downloads the og:image it points at. A tag that is
   correct in the repo proves nothing until the host serves it. */
const HOME = 'https://thechowk.online';

const get = (u, opts = {}) => fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(25000), ...opts });

(async () => {
  let html, res;
  try {
    res = await get(HOME + '/');
    html = await res.text();
  } catch (e) {
    console.log('FAIL  page      ' + e.message.split('\n')[0]);
    return;
  }
  console.log((res.ok ? 'ok   ' : 'FAIL ') + 'page'.padEnd(12) + res.status + '  ' + res.headers.get('content-type'));

  const tag = (re) => (html.match(re) || [, ''])[1];
  const img = tag(/<meta property="og:image" content="([^"]+)"/);
  const ogUrl = tag(/<meta property="og:url" content="([^"]+)"/);
  const title = tag(/<title>([^<]+)</);
  const card = tag(/<meta name="twitter:card" content="([^"]+)"/);

  console.log('     title     ' + title);
  console.log('     og:url    ' + ogUrl);
  console.log('     card      ' + card);
  console.log('     og:image  ' + img);

  // the part that actually decides whether the post shows a picture
  for (const [label, url] of [['og:image', img], ['badge.js', HOME + '/badge.js'],
                              ['sitemap', HOME + '/sitemap.xml'], ['robots', HOME + '/robots.txt']]) {
    if (!url) { console.log('FAIL ' + label.padEnd(12) + 'no url in the page'); continue; }
    try {
      const r = await get(url);
      const len = r.headers.get('content-length');
      const kb = len ? Math.round(len / 1024) + ' KB' : '';
      console.log((r.ok ? 'ok   ' : 'FAIL ') + label.padEnd(12) + r.status + '  ' +
        (r.headers.get('content-type') || '') + '  ' + kb);
    } catch (e) {
      console.log('FAIL ' + label.padEnd(12) + e.message.split('\n')[0]);
    }
  }

  const wrongHost = img && !img.startsWith(HOME);
  console.log('\n' + (res.ok && img && !wrongHost
    ? 'live and unfurlable — the card will render on X'
    : 'not ready yet'));
})();
