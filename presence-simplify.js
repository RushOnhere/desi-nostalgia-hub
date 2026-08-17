/* Rewrites the Presence module: no hub heartbeat, no owner token, no chip.
   All it does now is read the public badge counts and upgrade any card whose
   site carries the badge. */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'index.html');
let s = fs.readFileSync(file, 'utf8');

const start = s.indexOf('const Presence = (() => {');
if (start === -1) throw new Error('Presence module not found');
const tail = s.indexOf('Presence.start();', start);
if (tail === -1) throw new Error('Presence.start() not found');
const end = tail + 'Presence.start();'.length;

const replacement = `const Presence = (() => {
  const cfg = window.PRESENCE;
  if (!cfg || !cfg.url || !cfg.key) return { start() {} };

  const rpc = (fn, body) => fetch(cfg.url + '/rest/v1/rpc/' + fn, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: cfg.key, Authorization: 'Bearer ' + cfg.key },
    body: JSON.stringify(body || {}),
  });

  let poll = null, live = {};

  /* a site carrying the badge reports its own listeners, so that number
     replaces the scraped one */
  function applyToCards() {
    document.querySelectorAll('.card').forEach(card => {
      const dom = card.querySelector('.dom');
      const badge = card.querySelector('.live');
      if (!dom || !badge) return;
      const n = live[dom.textContent];
      if (!n) return;
      badge.classList.remove('stale');
      badge.classList.add('measured');
      badge.title = T().measuredTip;
      badge.innerHTML = '<i></i>' + inNum(n) + ' ' + T().now;
    });
  }

  async function refresh() {
    try {
      const r = await rpc('live_counts');
      if (!r.ok) return;
      live = {};
      (await r.json()).forEach(row => { live[row.site] = row.viewers; });
      applyToCards();
    } catch {}
  }

  function stop() { clearInterval(poll); poll = null; }
  function go() {
    if (poll) return;
    refresh();
    poll = setInterval(refresh, cfg.pollMs);
  }

  return {
    start() {
      go();
      document.addEventListener('visibilitychange', () => document.hidden ? stop() : go());
    },
    get counts() { return live; },
  };
})();

Presence.start();`;

s = s.slice(0, start) + replacement + s.slice(end);
fs.writeFileSync(file, s);

const gone = k => !s.includes(k);
console.log('ownerToken:', gone('ownerToken'), '| hub_viewers:', gone('hub_viewers'),
  '| paintHere:', gone('paintHere'), '| dna-owner:', gone('dna-owner'),
  '| heartbeat:', gone("rpc('heartbeat'"), '| badge counts kept:', s.includes("rpc('live_counts')"));
