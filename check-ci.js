/* The counts bot is a public repo, so its run history and step results can be
   read without a token. Shows which step actually failed. */
const REPO = 'RushOnhere/desi-nostalgia-hub';
const api = async (p) => {
  const r = await fetch('https://api.github.com/repos/' + REPO + p, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'chowk' },
    signal: AbortSignal.timeout(25000)
  });
  if (!r.ok) throw new Error(r.status + ' ' + r.statusText + ' on ' + p);
  return r.json();
};

(async () => {
  const runs = await api('/actions/workflows/refresh-counts.yml/runs?per_page=10');
  console.log('last 10 runs:');
  for (const r of runs.workflow_runs) {
    console.log('  #' + String(r.run_number).padEnd(5) + (r.conclusion || r.status).padEnd(10) +
      new Date(r.created_at).toISOString().slice(0, 16).replace('T', ' ') + '  ' + r.head_sha.slice(0, 7));
  }
  const failed = runs.workflow_runs.find(r => r.conclusion === 'failure');
  if (!failed) { console.log('\nno failures in the last 10'); return; }

  console.log('\n--- steps of the newest failure, run #' + failed.run_number + ' ---');
  const jobs = await api('/actions/runs/' + failed.id + '/jobs');
  for (const j of jobs.jobs) {
    console.log(j.name + ': ' + j.conclusion);
    for (const s of j.steps || []) {
      const mark = s.conclusion === 'failure' ? 'FAILED  ' : (s.conclusion === 'skipped' ? 'skipped ' : 'ok      ');
      console.log('   ' + mark + s.name);
    }
  }
  console.log('\nfull log: ' + failed.html_url);
})();
