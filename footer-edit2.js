/* second pass: the blocks my earlier patterns did not match */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'index.html');
let s = fs.readFileSync(file, 'utf8');

const lines = s.split('\n');

// 1. the here-now chip markup (its indentation differed from what I matched)
const chipStart = lines.findIndex(l => l.includes('<div class="here" id="here"'));
if (chipStart !== -1) {
  let end = chipStart;
  while (end < lines.length && !lines[end].trim().startsWith('</div>')) end++;
  lines.splice(chipStart, end - chipStart + 2);   // block plus the blank line after
}

// 2. the credit-gap IIFE
const gapStart = lines.findIndex(l => l.includes('an open invitation, stated once'));
if (gapStart !== -1) {
  let end = gapStart;
  while (end < lines.length && !lines[end].startsWith('})();')) end++;
  lines.splice(gapStart, end - gapStart + 1);
}

s = lines.join('\n');

// 3. the owner-token block and the hub read
s = s.replace(/  \/\/ the archive's own count is private[\s\S]*?  \} catch \{\}\n/, '');
s = s.replace(/  const paintHere = n => \{[\s\S]*?\n  \};\n/, '');
s = s.replace(/\n    if \(!ownerToken\) return;[\s\S]*?\n    \} catch \{\}\n/, '\n');
s = s.replace(/  const hereBox = document\.getElementById\('here'\);\n/, '');
s = s.replace(/  const hereNum = document\.getElementById\('here-num'\);\n/, '');

// 4. leftover css for the chip
s = s.replace(/\/\* our own count, measured rather than scraped \*\/\n\.here \{[\s\S]*?display: none !important; \} \}\n/, '');
s = s.replace(/\.here-num \{[^\n]*\n/, '');
s = s.replace(/\.here-label \{[^\n]*\n/, '');

fs.writeFileSync(file, s);
const gone = k => !s.includes(k);
console.log('here chip:', gone('id="here"'), '| credit-gap:', gone('credit-gap'),
  '| ownerToken:', gone('ownerToken'), '| hub_viewers:', gone('hub_viewers'),
  '| paintHere:', gone('paintHere'), '| .here css:', gone('.here-num'));
