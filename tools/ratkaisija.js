// Walkthroughs for Pisara: finds a sequence of tilts that beats each level, and replays stored ones.
//
// A walkthrough is a list of moves, each held for MOVE seconds:
//   direction  Y = ylös, A = alas, V = vasen, O = oikea (combined: YV, YO, AV, AO), '-' = leaf level
//   '~'        after the direction: half tilt (otherwise full tilt)
// e.g. "AV AV O~ - Y" = down-left twice, half right, wait, up.
//
// pisaraSolver.solve(i)      search a walkthrough for level i (numbered from 0)
// pisaraSolver.solveAll()    search all levels; results in pisaraSolver.found
// pisaraSolver.follow(i, w)  play walkthrough w on level i and report the outcome
// pisaraSolver.followAll(o)  play every stored walkthrough (object: level number → walkthrough)
(() => {
  const S = window.pisaraSim;
  const MOVE = 0.5;
  const D = Math.SQRT1_2;
  const DIRS = { Y: [0, -1], YO: [D, -D], O: [1, 0], AO: [D, D], A: [0, 1], AV: [-D, D], V: [-1, 0], YV: [-D, -D] };
  const FULL = ['-', ...Object.keys(DIRS)];
  const MOVES = FULL.concat(Object.keys(DIRS).map(k => k + '~'));

  const tiltOf = m => {
    if (m === '-') return [0, 0];
    const half = m.endsWith('~'), [x, y] = DIRS[half ? m.slice(0, -1) : m];
    return half ? [x * 0.5, y * 0.5] : [x, y];
  };

  // same scoring idea as the bot: water kept, walking distance between drops (holes block small drops)
  const W = 100, H = 160, G = 2, GW = W / G, GH = H / G;
  let gridLevel = null; const grids = new Map();
  function blockedGrid(L, rho) {
    if (gridLevel !== L) { gridLevel = L; grids.clear(); }
    const key = (Math.round(rho * 4) / 4).toFixed(2);
    if (grids.has(key)) return grids.get(key);
    const b = new Uint8Array(GW * GH), pad = 1.5;
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const x = (i + 0.5) * G, y = (j + 0.5) * G;
      let bl = false;
      for (const [wx, wy, ww, wh] of L.walls || []) if (x > wx - pad && x < wx + ww + pad && y > wy - pad && y < wy + wh + pad) bl = true;
      for (const [rx, ry, rr] of L.rocks || []) if (Math.hypot(x - rx, y - ry) < rr + pad) bl = true;
      for (const [hx, hy, hr] of L.drains || []) if (hr > rho && Math.hypot(x - hx, y - hy) < hr + 0.4 * rho) bl = true;
      b[j * GW + i] = bl ? 1 : 0;
    }
    grids.set(key, b);
    return b;
  }
  const cell = (x, y) => Math.max(0, Math.min(GH - 1, Math.floor(y / G))) * GW + Math.max(0, Math.min(GW - 1, Math.floor(x / G)));
  function field(blocked, x, y) {
    const d = new Int32Array(GW * GH).fill(1e8), q = new Int32Array(GW * GH);
    const s = cell(x, y); d[s] = 0; let head = 0, tail = 0; q[tail++] = s;
    while (head < tail) {
      const c = q[head++], i = c % GW, j = (c - i) / GW, nd = d[c] + 1;
      if (i > 0 && !blocked[c - 1] && d[c - 1] > nd) { d[c - 1] = nd; q[tail++] = c - 1; }
      if (i < GW - 1 && !blocked[c + 1] && d[c + 1] > nd) { d[c + 1] = nd; q[tail++] = c + 1; }
      if (j > 0 && !blocked[c - GW] && d[c - GW] > nd) { d[c - GW] = nd; q[tail++] = c - GW; }
      if (j < GH - 1 && !blocked[c + GW] && d[c + GW] > nd) { d[c + GW] = nd; q[tail++] = c + GW; }
    }
    return d;
  }
  function mst(L, drops) {
    const n = drops.length;
    if (n < 2) return 0;
    const f = drops.map(([x, y, r]) => field(blockedGrid(L, r), x, y));
    const inTree = new Array(n).fill(false), best = new Array(n).fill(Infinity);
    best[0] = 0; let total = 0;
    for (let k = 0; k < n; k++) {
      let u = -1;
      for (let v = 0; v < n; v++) if (!inTree[v] && (u < 0 || best[v] < best[u])) u = v;
      inTree[u] = true; total += Math.min(best[u], 1e4);
      for (let v = 0; v < n; v++) if (!inTree[v]) best[v] = Math.min(best[v], f[u][cell(drops[v][0], drops[v][1])]);
    }
    return total;
  }
  function score(L, info) {
    if (info.state === 'won') return 1e9 - info.time;
    if (info.state === 'failed' || info.state === 'failing') return -1e9;
    return info.remaining * 2000 - mst(L, info.drops) * G * 3 - info.drops.length * 40;
  }
  // coarse fingerprint of a position, so the beam does not fill with near-identical states
  const key = info => info.drops.map(([x, y, r]) => `${Math.round(x / 3)},${Math.round(y / 3)},${Math.round(r * 2)}`).sort().join('|');

  // yield to the browser; a MessageChannel is not throttled the way timers are in a hidden tab
  const channel = new MessageChannel(), waiting = [];
  channel.port1.onmessage = () => waiting.shift()();
  const pause = () => new Promise(r => { waiting.push(r); channel.port2.postMessage(0); });

  // beam search over moves
  // moves: which moves to try; stall: give up after this many moves without a better position
  async function solve(i, { beam = 8, maxMoves = 240, moves = FULL, stall = 40 } = {}) {
    const { level } = S.load(i);
    let frontier = [{ snap: S.snap(), path: [], score: score(level, S.info()) }];
    let best = frontier[0].score, sinceBest = 0;
    for (let depth = 0; depth < maxMoves; depth++) {
      const children = [], seen = new Set();
      for (const node of frontier) {
        for (const m of moves) {
          S.restore(node.snap);
          const [tx, ty] = tiltOf(m);
          S.run(tx, ty, MOVE);
          const info = S.info();
          if (info.state === 'won') return { level: i + 1, won: true, path: node.path.concat(m), time: info.time, remaining: info.remaining };
          const sc = score(level, info);
          if (sc <= -1e8) continue;
          const k = key(info);
          if (seen.has(k)) continue;
          seen.add(k);
          children.push({ snap: S.snap(), path: node.path.concat(m), score: sc });
        }
      }
      if (!children.length) break;
      children.sort((a, b) => b.score - a.score);
      frontier = children.slice(0, beam);
      if (frontier[0].score > best + 1) { best = frontier[0].score; sinceBest = 0; }
      else if (++sinceBest > stall) break;
      if (depth % 4 === 0) { S.restore(frontier[0].snap); S.show(); }
      await pause();   // yield every move so the page stays responsive
    }
    return { level: i + 1, won: false, path: frontier[0] ? frontier[0].path : [] };
  }

  // play a walkthrough and report what happened
  function follow(i, walkthrough) {
    S.load(i);
    const moves = walkthrough.trim().split(/\s+/);
    for (const m of moves) { const [tx, ty] = tiltOf(m); S.run(tx, ty, MOVE); }
    S.run(0, 0, 1.5);   // let the last merge settle
    S.show();
    const info = S.info();
    return { level: i + 1, won: info.state === 'won', time: info.time, remaining: info.remaining, need: info.need, moves: moves.length };
  }

  const solver = { found: {}, status: 'valmis', MOVES, solve, follow };
  solver.solveAll = async (from = 0, to = S.count - 1) => {
    for (let i = from; i <= to; i++) {
      solver.status = `taso ${i + 1}`;
      let res = await solve(i);
      if (!res.won) { solver.status = `taso ${i + 1}, leveämpi haku`; res = await solve(i, { beam: 20, maxMoves: 300, moves: MOVES, stall: 80 }); }
      solver.found[i + 1] = res;
    }
    solver.status = 'valmis';
    return solver.found;
  };
  solver.followAll = walkthroughs => Object.keys(walkthroughs).map(n => follow(n - 1, walkthroughs[n]));
  window.pisaraSolver = solver;
})();
