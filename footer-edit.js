/* - drop the private "here now" chip and everything that fed it
   - drop the thread credit line and the missing-credits note
   - footer becomes "made with love, using Claude", on the same glass as the rest */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'index.html');
let s = fs.readFileSync(file, 'utf8');
const before = s.length;

/* ---------- 1. the here-now chip ---------- */
s = s.replace(/    <div class="here" id="here"[\s\S]*?<\/div>\n\n/, '');
s = s.replace(/\/\* our own count, measured rather than scraped \*\/\n\.here \{[\s\S]*?@media \(max-width: 820px\)  \{ \.here \{ display: none !important; \} \}\n/, '');

/* ---------- 2. the presence client: keep badge counts, drop the hub ---------- */
// the owner token block
s = s.replace(/  \/\/ the archive's own count is private[\s\S]*?  const hereBox = document\.getElementById\('here'\);\n/, '');
s = s.replace(/  const hereBox = document\.getElementById\('here'\);\n/, '');
s = s.replace(/  const hereNum = document\.getElementById\('here-num'\);\n/, '');
s = s.replace(/  const paintHere = n => \{[\s\S]*?\n  \};\n\n/, '');
// no longer heartbeat for the hub, and never ask for its count
s = s.replace(/  async function tick\(\) \{[\s\S]*?\n  \}\n\n/, '');
s = s.replace(/    if \(!ownerToken\) return;[\s\S]*?\n    \} catch \{\}\n  \}/, '  }');
s = s.replace(/      await tick\(\);        \/\/ land our own heartbeat first…\n/, '');
s = s.replace(/    beat = setInterval\(tick, cfg\.beatMs\);\n/, '');
s = s.replace(/  function stop\(\) \{ clearInterval\(beat\); clearInterval\(poll\); beat = poll = null; \}/,
  '  function stop() { clearInterval(poll); poll = null; }');
s = s.replace(/  let beat = null, poll = null, live = \{\};/, '  let poll = null, live = {};');
s = s.replace(/    if \(beat\) return;\n/, '    if (poll) return;\n');
s = s.replace(/  \/\/ an anonymous, stable id — no account, nothing personal\n[\s\S]*?\} catch \{ me = crypto\.randomUUID\(\); \}\n\n/, '');

/* ---------- 3. the footer ---------- */
const claudeMark =
  '<svg class="claude-mark" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
  '<path d="M32.4286 81.1404L52.8708 69.6696L53.2129 68.6699L52.8708 68.1174H51.8711L48.4509 67.9069L36.7696 67.5912L26.6406 67.1702L16.8273 66.6441L14.3543 66.1179L12.0391 63.066L12.2758 61.5401L14.3543 60.1457L17.3272 60.4088L23.9045 60.8561L33.7704 61.5401L40.9265 61.961L51.5291 63.066H53.2129L53.4496 62.382L52.8708 61.961L52.4236 61.5401L42.2156 54.6208L31.1658 47.3069L25.3778 43.0974L22.247 40.9664L20.6685 38.9669L19.9844 34.5995L22.8258 31.4688L26.6406 31.7318L27.6141 31.9949L31.4815 34.9679L39.7426 41.361L50.5293 49.3064L52.1079 50.6218L52.7393 50.1746L52.8182 49.8588L52.1079 48.6749L46.2409 38.0723L39.9794 27.2856L37.1906 22.8131L36.4539 20.1295C36.1908 19.0245 36.0067 18.1037 36.0067 16.9724L39.2427 12.5788L41.0317 12L45.3464 12.5788L47.1618 14.1573L49.8453 20.2874L54.1863 29.9428L60.9214 43.0711L62.8946 46.9648L63.947 50.5692L64.3416 51.6742H65.0257V51.0428L65.5781 43.6499L66.6042 34.5732L67.604 22.892L67.946 19.6033L69.5771 15.657L72.8132 13.5259L75.3388 14.7361L77.4173 17.7091L77.1279 19.6296L75.8913 27.6539L73.4709 40.2297L71.8923 48.6486H72.8132L73.8655 47.5963L78.1276 41.9398L85.2837 32.9947L88.4408 29.443L92.1241 25.5229L94.4919 23.6549H98.9644L102.253 28.5484L100.78 33.5998L96.1757 39.4404L92.3608 44.3865L86.8885 51.7531L83.4684 57.6463L83.7841 58.1199L84.5996 58.041L96.9649 55.4101L103.647 54.1999L111.619 52.8318L115.223 54.5156L115.618 56.2257L114.197 59.7248L105.673 61.8295L95.6758 63.829L80.7848 67.3544L80.6007 67.486L80.8111 67.7491L87.52 68.3805L90.3877 68.5383H97.4122L110.488 69.5118L113.908 71.7743L115.96 74.5368L115.618 76.6415L110.356 79.3251L103.253 77.6413L86.6781 73.6949L80.9953 72.2742H80.206V72.7478L84.9417 77.3782L93.6237 85.2183L104.489 95.321L105.042 97.8204L103.647 99.7936L102.174 99.5831L92.6239 92.4007L88.9407 89.1647L80.6007 82.1401H80.0482V82.8768L81.9687 85.6919L92.1241 100.951L92.6502 105.634L91.9136 107.16L89.2827 108.081L86.3887 107.555L80.4428 99.2148L74.3128 89.8224L69.3667 81.4035L68.7616 81.7455L65.8412 113.185L64.4732 114.79L61.3161 116L58.6852 114L57.2908 110.764L58.6852 104.371L60.3689 96.0314L61.737 89.4015L62.9735 81.1667L63.7102 78.4306L63.6576 78.2464L63.0525 78.3253L56.8435 86.8495L47.3985 99.6094L39.9267 107.607L38.1377 108.318L35.0332 106.713L35.3226 103.845L37.059 101.293L47.3985 88.1386L53.6338 79.9828L57.6591 75.2735L57.6328 74.5894H57.396L29.9293 92.427L25.0358 93.0584L22.931 91.0853L23.1941 87.8492L24.1939 86.7969L32.455 81.1141L32.4286 81.1404Z" fill="#D97757"/></svg>';

const footStart = s.indexOf('<footer>');
const footEnd = s.indexOf('</footer>') + '</footer>'.length;
if (footStart === -1) throw new Error('footer not found');
const keys = s.slice(footStart, footEnd).match(/<div class="keys">[\s\S]*?<\/div>/)[0];

s = s.slice(0, footStart) +
  '<footer>\n' +
  '  <span class="made">\n' +
  '    <span class="bi"><b lang="hi">प्यार से बनाया</b><b lang="en">made with love</b></span>\n' +
  '    <span class="heart" aria-hidden="true">♥</span>\n' +
  '    <span class="bi"><b lang="hi">Claude के साथ</b><b lang="en">using Claude</b></span>\n' +
  '    ' + claudeMark + '\n' +
  '  </span>\n  ' + keys + '\n</footer>' +
  s.slice(footEnd);

// footer styling: same frosted glass as the rest of the chrome
s = s.replace(/footer \{\n  position: relative; z-index: 1;\n  border-top: 1px solid var\(--line\);/,
`footer {
  position: relative; z-index: 1;
  border-top: 1px solid var(--line);
  background: color-mix(in srgb, var(--ink) 62%, transparent);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);`);

s = s.replace('.keys { margin-left: auto; display: flex; gap: 16px; flex-wrap: wrap; }',
`.made {
  display: inline-flex; align-items: center; gap: 9px;
  font: 400 14px/1 var(--sans); color: var(--muted); letter-spacing: .01em;
}
.made .heart { color: #d9575c; font-size: 13px; }
.claude-mark { width: 19px; height: 19px; display: block; }
.keys { margin-left: auto; display: flex; gap: 16px; flex-wrap: wrap; }`);

/* ---------- 4. the strings that fed the removed lines ---------- */
s = s.replace(/  document\.querySelector\('footer > span'\)\.innerHTML[^\n]*\n/, '');
s = s.replace(/  const missing = SITES\.filter[^\n]*\n/, '');
s = s.replace(/  if \(missing\) document\.getElementById\('credit-gap'\)[^\n]*\n/, '');
s = s.replace(/^    footer: '[\s\S]*?',$/m, '');
s = s.replace(/^    creditGap: [^\n]*$/gm, '');

fs.writeFileSync(file, s);
console.log('here-chip gone:', !s.includes('id="here"'));
console.log('thread credit gone:', !s.includes('suraj_sharma14 के धागे'));
console.log('credit-gap gone:', !s.includes('credit-gap'));
console.log('footer mark in:', s.includes('claude-mark'));
console.log('size', before, '->', s.length);
