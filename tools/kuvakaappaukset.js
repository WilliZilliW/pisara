// Sets up one scene for a Play Store screenshot; tools/kuvakaappaukset.sh runs a headless browser once per scene.
// The scene name comes from the URL (?kohtaus=…). Play scenes run the level's walkthrough partway with the game's own
// physics and stop mid-tilt, so drops are moving and deformed as in real play.
(() => {
  const D = Math.SQRT1_2;
  const DIRS = { Y: [0, -1], YO: [D, -D], O: [1, 0], AO: [D, D], A: [0, 1], AV: [-D, D], V: [-1, 0], YV: [-D, -D] };
  const tiltOf = m => {
    if (m === '-') return [0, 0];
    const half = m.endsWith('~'), [x, y] = DIRS[half ? m.slice(0, -1) : m];
    return half ? [x * 0.5, y * 0.5] : [x, y];
  };

  // level number, how many walkthrough moves to play, then a short final tilt that leaves the drops moving
  const SCENES = {
    sokkelo: [6, 6, 'AV', 0.25],
    aurinko: [21, 1, 'AV', 0.3],
    sammal: [33, 4, 'O', 0.3],
    kehä: [46, 2, 'AO', 0.2],
    viimeinen: [60, 6, 'YV', 0.2],
  };

  function playScene([n, moves, last, secs]) {
    const S = window.pisaraSim;
    S.load(n - 1);
    for (const m of PISARA_OHJEET[n].split(/\s+/).slice(0, moves)) { const [x, y] = tiltOf(m); S.run(x, y, 0.5); }
    const [x, y] = tiltOf(last); S.run(x, y, secs);
    S.show();
  }

  // the result screen of a cleared level, filled in from the level's actual three-star run
  function resultScene(n) {
    const S = window.pisaraSim;
    S.load(n - 1);
    for (const m of PISARA_OHJEET[n].split(/\s+/)) { const [x, y] = tiltOf(m); S.run(x, y, 0.5); }
    const info = S.info(), L = PISARA_LEVELS[n - 1];
    const V0 = L.drops.reduce((s, d) => s + d[2] ** 3, 0), kept = info.drops[0][2] ** 3 / V0;
    const t = info.time.toFixed(1).replace('.', ',') + ' s';
    S.show();
    document.getElementById('res-eyebrow').textContent = `Taso ${n} · ${L.name}`;
    document.getElementById('res-title').textContent = 'Yksi pisara!';
    document.getElementById('res-facts').innerHTML =
      `<div><b>${Math.floor(kept * 100)} %</b><span>vettä jäljellä (raja ${Math.round((1 - L.maxLoss) * 100)} %)</span></div>` +
      `<div><b>${t}</b><span>uusi ennätys</span></div>`;
    document.getElementById('res-stars').innerHTML = ['Taso läpäisty', 'Vettä säilyi vähintään 95 %', 'Aika enintään ' + L.par + ',0 s']
      .map(l => `<div class="star-row"><i>★</i>${l}</div>`).join('');
    document.getElementById('res-stars').hidden = false;
    document.getElementById('res-actions').innerHTML =
      '<button class="btn primary">Seuraava taso</button><button class="btn">Uudelleen</button><button class="btn">Tasot</button>';
    document.getElementById('result').hidden = false;
  }

  window.addEventListener('load', () => {
    const scene = new URLSearchParams(location.search).get('kohtaus');
    if (SCENES[scene]) playScene(SCENES[scene]);
    else if (scene === 'tulos') resultScene(12);
    // 'valikko': the start menu as it opens, with the progress set up by tools/kuvakaappaukset.sh
  });
})();
