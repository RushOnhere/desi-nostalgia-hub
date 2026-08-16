/* Generates artifact.html (a page fragment) from index.html.
   The Artifact host supplies <!doctype>, <html>, <head> and <body>,
   so we strip our own wrapper and keep title + styles + body content. */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const src = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

const title = src.match(/<title>[\s\S]*?<\/title>/)[0];
const style = src.match(/<style>[\s\S]*?<\/style>/)[0];
let  body   = src.match(/<body>([\s\S]*?)<\/body>/)[1].trim();

// the artifact must be a single self-contained page: inline every data file
for (const f of ['shots.js', 'palette.js', 'crowd.js', 'frameable.js']) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  body = body.replace('<script src="' + f + '"></script>', '<script>\n' + src + '\n</script>');
  if (body.includes('src="' + f + '"')) throw new Error(f + ' was not inlined — check the script tag');
}

const out = title + '\n' + style + '\n\n' + body + '\n';
fs.writeFileSync(path.join(dir, 'artifact.html'), out);
console.log('artifact.html written —', (out.length / 1024 / 1024).toFixed(2), 'MB');
