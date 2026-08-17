/* The submit sheet is now one button that opens the Google Form. Strip out the
   old draft-a-post machinery: fields, preview, X/copy buttons, server note. */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'index.html');
let s = fs.readFileSync(file, 'utf8');

// 1. the module: no fields, no draft
s = s.replace(/const Submit = \(\(\) => \{[\s\S]*?\n\}\)\(\);/,
`const Submit = (() => {
  const el = document.getElementById('submit');
  return {
    get open() { return el.classList.contains('on'); },
    show() {
      document.getElementById('s-form').href = SUBMIT_TO.form || '#';
      el.classList.add('on');
      el.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      Sfx.tick();
    },
    hide() {
      el.classList.remove('on');
      el.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      Sfx.release();
    },
  };
})();`);

// 2. everything that drove the old buttons
s = s.replace(/window\.wireSubmitRoutes = wireSubmitRoutes;\n\/\* point the two links[\s\S]*?Sfx\.launch\(\)\);\n/, '');
s = s.replace(/document\.getElementById\('s-post'\)\.addEventListener\('click'[\s\S]*?\n\}\);\n/, '');
s = s.replace(/document\.getElementById\('s-copy'\)\.addEventListener\('click'[\s\S]*?\n\}\);\n/, '');
s = s.replace(/document\.getElementById\('s-(github|form)'\)\.addEventListener\('pointerdown'[^\n]*\n/g, '');

// 3. paintStatic no longer touches removed nodes
s = s.replace(/  const fs_ = document\.querySelectorAll\('\.field span'\);\n[\s\S]*?sheet-note'\)\.textContent = t\.sheetNote;\n/, '');
s = s.replace(/  document\.getElementById\('s-post'\)\.lastChild\.textContent[^\n]*\n/, '');
s = s.replace(/  document\.getElementById\('s-copy'\)\.lastChild\.textContent[^\n]*\n/, '');

// 4. the sheet opens plainly now, with no row context to carry
s = s.replace(/Submit\.show\(catLabel\(row\.cat\.id\)\)/, 'Submit.show()');

// 5. one sound hook for the single button
s = s.replace("document.getElementById('submit-close').addEventListener('click', () => Submit.hide());",
`document.getElementById('submit-close').addEventListener('click', () => Submit.hide());
document.getElementById('s-form').addEventListener('pointerenter', () => Sfx.hover());
document.getElementById('s-form').addEventListener('pointerdown', () => Sfx.launch());`);

// 6. make the single button read as the one thing to do
s = s.replace('.sheet-actions { display: flex; gap: 10px; flex-wrap: wrap; }',
`.sheet-go { width: 100%; justify-content: center; height: 52px; font-size: 15px; margin-top: 4px; }
.sheet-actions { display: flex; gap: 10px; flex-wrap: wrap; }`);

fs.writeFileSync(file, s);

const dead = ['s-post', 's-copy', 's-url', 's-who', 's-what', 's-preview', 'seat-note', 'wireSubmitRoutes', 'sheetNote', 'sheet-note']
  .filter(id => s.includes("'" + id + "'") || s.includes('"' + id + '"'));
console.log('sheet simplified | leftover references:', dead.length ? dead.join(', ') : 'none');
