fetch('data/entities.json')
  .then(r => {
    if (!r.ok) throw new Error('Failed to load entities.json: ' + r.status);
    return r.json();
  })
  .then(data => init(data))
  .catch(err => {
    console.error('Pantheon Concordance: could not load data/entities.json', err);
    document.body.innerHTML = '<p style="color:#c04040;padding:2rem;font-family:sans-serif">Error: could not load entity data. If running locally, serve via a local web server (e.g. <code>python3 -m http.server</code>) rather than opening the file directly.</p>';
  });
