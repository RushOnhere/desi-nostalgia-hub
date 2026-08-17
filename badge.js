/* देसी नॉस्टैल्जिया आर्काइव — live listener badge.
   Drop this one line into your site:

     <script defer src="https://YOUR-DOMAIN/badge.js"></script>

   It reports an anonymous heartbeat so your site shows a real "listening now"
   count on the archive, and it draws a small chip linking back. To skip the
   chip and only report the count:

     <script defer src="https://YOUR-DOMAIN/badge.js" data-chip="off"></script>

   No cookies, no accounts, nothing personal — just a random id in localStorage
   so the same tab is not counted twice. */
(function () {
  var CFG = {
    url: 'https://iomcpnyfnuvujgzamtbp.supabase.co',
    key: 'sb_publishable_ahLqxPOO8qFkYgQIJAQW6g_5CbDAdb5',
    home: 'https://chowk.vercel.app',
    beatMs: 20000,
  };

  var me = document.currentScript;
  var showChip = !me || me.getAttribute('data-chip') !== 'off';
  var site = location.hostname.replace(/^www\./, '');
  if (!site || site === 'localhost') return;

  var id;
  try {
    id = localStorage.getItem('dna-visitor');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('dna-visitor', id); }
  } catch (e) { id = crypto.randomUUID(); }

  function rpc(fn, body) {
    return fetch(CFG.url + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: CFG.key, Authorization: 'Bearer ' + CFG.key },
      body: JSON.stringify(body || {}),
      keepalive: true,
    });
  }

  var chip, num;
  function makeChip() {
    chip = document.createElement('a');
    chip.href = CFG.home;
    chip.target = '_blank';
    chip.rel = 'noopener noreferrer';
    chip.setAttribute('aria-label', 'live listeners — Desi Nostalgia Archive');
    chip.style.cssText = [
      'position:fixed', 'right:16px', 'bottom:16px', 'z-index:2147483000',
      'display:inline-flex', 'align-items:center', 'gap:8px',
      'padding:8px 13px', 'border-radius:999px', 'text-decoration:none',
      'background:rgba(8,11,17,.82)', 'border:1px solid rgba(255,255,255,.16)',
      'color:#fff', 'font:500 12px/1 system-ui,-apple-system,sans-serif',
      'box-shadow:0 10px 30px -12px rgba(0,0,0,.8)', 'opacity:0',
      'transition:opacity .4s ease,transform .4s ease', 'transform:translateY(6px)',
    ].join(';');
    var dot = document.createElement('span');
    dot.style.cssText = 'width:6px;height:6px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80';
    num = document.createElement('b');
    num.style.cssText = 'font-weight:600';
    num.textContent = '—';
    var label = document.createElement('span');
    label.style.cssText = 'opacity:.72';
    label.textContent = 'listening now';
    chip.appendChild(dot); chip.appendChild(num); chip.appendChild(label);
    document.body.appendChild(chip);
  }

  function show(n) {
    if (!chip || !n) return;
    num.textContent = n.toLocaleString('en-IN');
    chip.style.opacity = '1';
    chip.style.transform = 'none';
  }

  function beat() { rpc('heartbeat', { p_site: site, p_visitor: id }).catch(function () {}); }

  function read() {
    if (!showChip) return;
    rpc('live_counts').then(function (r) { return r.json(); }).then(function (rows) {
      for (var i = 0; i < rows.length; i++) if (rows[i].site === site) return show(rows[i].viewers);
    }).catch(function () {});
  }

  function start() {
    if (showChip && document.body) makeChip();
    beat();
    setTimeout(read, 1200);
    var t = setInterval(function () {
      if (document.hidden) return;
      beat(); read();
    }, CFG.beatMs);
    window.addEventListener('pagehide', function () { clearInterval(t); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
