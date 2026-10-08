// Sets up one scene for a Play Store screenshot; tools/kuvakaappaukset.mjs opens the page once per scene and language.
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

  // the game's own result screen after the level's actual three-star run
  function resultScene(n) {
    const S = window.pisaraSim;
    S.load(n - 1);
    for (const m of PISARA_OHJEET[n].split(/\s+/)) { const [x, y] = tiltOf(m); S.run(x, y, 0.5); }
    S.show();
    S.showResult();
  }

  window.addEventListener('load', () => {
    const scene = new URLSearchParams(location.search).get('kohtaus');
    if (SCENES[scene]) playScene(SCENES[scene]);
    else if (scene === 'tulos') resultScene(12);
    // 'valikko': the start menu as it opens, with the progress set up by tools/kuvakaappaukset.sh
  });
})();
