/* One command to bring the site up to date:
     node refresh.js            -> re-read every site's live count, rebuild
     node refresh.js --shots    -> also re-capture any weak/blank previews
     node refresh.js --og       -> also regenerate the share card
   No database involved: the data files are just JS the page loads. */
const { execFileSync } = require('child_process');
const path = require('path');

const step = (label, file) => {
  process.stdout.write('\n=== ' + label + ' ===\n');
  execFileSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' });
};

const args = process.argv.slice(2);

step('reading live counts off each site', 'scrape-counts.js');

if (args.includes('--shots')) {
  step('auditing previews', 'audit-shots.js');
  step('re-capturing the weak ones', 'recapture.js');
  step('resizing previews', 'shrink-shots.js');
  step('re-reading colours', 'extract-palette.js');
}

if (args.includes('--og') || args.includes('--shots')) step('rebuilding the share card', 'make-og.js');

step('building the single-file artifact', 'build-artifact.js');

console.log('\nDone. Commit and push (or run: vercel --prod) to publish the update.');
