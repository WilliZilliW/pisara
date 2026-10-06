// Static analysis of Pisara levels: can every level be beaten, judging by geometry alone?
// Runs on the test page (tools/testi.sh) and uses the game's own level data and rim gaps.
//
// Per level it works out:
//  - where a drop of a given size can travel: walls and bumps block it, the leaf's sides bound it,
//    and a hole blocks any drop smaller than the hole (with a margin for the hole's pull)
//  - merge order: drops start as their own groups; a group joins another when some drop size the
//    group can make (a single drop, or its smallest drops merged together) can reach the other group.
//    Joins that need a merged drop bigger than any single one are reported: they must be built first.
//  - the water budget: the biggest group at the end must hold at least the level's water limit
//  - risky starts: drops beside a rim gap, inside a sun spot or in moss
(() => {
  const W = 100, H = 160;
  const S = window.pisaraSim;

  const rectDist = (x, y, [wx, wy, ww, wh]) => {
    const cx = Math.max(wx, Math.min(x, wx + ww)), cy = Math.max(wy, Math.min(y, wy + wh));
    return Math.hypot(x - cx, y - cy);
  };

  // cells (1 unit) where the centre of a drop of radius rho can be
  const gridCache = new Map();
  function freeGrid(L, rho) {
    const key = rho.toFixed(2);
    if (gridCache.has(key)) return gridCache.get(key);
    const g = new Uint8Array(W * H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const x = i + 0.5, y = j + 0.5;
      let ok = x >= rho && x <= W - rho && y >= rho && y <= H - rho;
      if (ok) for (const w of L.walls || []) if (rectDist(x, y, w) < rho) { ok = false; break; }
      if (ok) for (const [rx, ry, rr] of L.rocks || []) if (Math.hypot(x - rx, y - ry) < rr + rho) { ok = false; break; }
      if (ok) for (const [hx, hy, hr] of L.drains || []) if (hr > rho && Math.hypot(x - hx, y - hy) < hr + 0.4 * rho) { ok = false; break; }
      g[j * W + i] = ok ? 1 : 0;
    }
    gridCache.set(key, g);
    return g;
  }

  // cells reachable from (x, y); starts from the nearest free cell within 3 units
  function region(g, x, y) {
    const seen = new Uint8Array(W * H), q = new Int32Array(W * H);
    let start = -1, bestD = 9;
    for (let j = Math.floor(y) - 3; j <= Math.floor(y) + 3; j++) for (let i = Math.floor(x) - 3; i <= Math.floor(x) + 3; i++) {
      if (i < 0 || j < 0 || i >= W || j >= H || !g[j * W + i]) continue;
      const d = Math.hypot(i + 0.5 - x, j + 0.5 - y);
      if (d < bestD) { bestD = d; start = j * W + i; }
    }
    if (start < 0) return seen;
    let head = 0, tail = 0; q[tail++] = start; seen[start] = 1;
    while (head < tail) {
      const c = q[head++], i = c % W;
      for (const n of [i > 0 ? c - 1 : -1, i < W - 1 ? c + 1 : -1, c - W, c + W]) {
        if (n < 0 || n >= W * H || seen[n] || !g[n]) continue;
        seen[n] = 1; q[tail++] = n;
      }
    }
    return seen;
  }

  // does the reached region bring a drop of radius rho into contact with a drop at (x, y, r)?
  function touches(seen, rho, [x, y, r]) {
    const reach = rho + r - 0.3;
    for (let j = Math.floor(y - reach); j <= Math.ceil(y + reach); j++) for (let i = Math.floor(x - reach); i <= Math.ceil(x + reach); i++) {
      if (i < 0 || j < 0 || i >= W || j >= H || !seen[j * W + i]) continue;
      if (Math.hypot(i + 0.5 - x, j + 0.5 - y) <= reach) return true;
    }
    return false;
  }

  const vol = r => r * r * r;

  function analyse(i) {
    const { level: L, gaps } = S.load(i);
    gridCache.clear();
    const drops = L.drops;
    const V0 = drops.reduce((s, d) => s + vol(d[2]), 0);
    const need = 1 - L.maxLoss;

    // sizes a group can make: each single drop, and its smallest drops merged one by one
    const sizesOf = ids => {
      const rs = ids.map(k => drops[k][2]).sort((a, b) => a - b);
      const out = new Set(rs.map(r => +r.toFixed(2)));
      let v = 0;
      for (const r of rs) { v += vol(r); out.add(+Math.cbrt(v).toFixed(2)); }
      return [...out].sort((a, b) => a - b);
    };

    let groups = drops.map((d, k) => [k]);
    const builds = [];   // joins that need a merged drop
    let changed = true;
    while (changed && groups.length > 1) {
      changed = false;
      outer: for (let a = 0; a < groups.length; a++) {
        const A = groups[a];
        const maxSingle = Math.max(...A.map(k => drops[k][2]));
        for (const rho of sizesOf(A)) {
          // start from the group's biggest drop: merged drops gather there in practice
          const from = A.reduce((p, k) => drops[k][2] > drops[p][2] ? k : p, A[0]);
          const seen = region(freeGrid(L, rho), drops[from][0], drops[from][1]);
          for (let b = 0; b < groups.length; b++) {
            if (b === a) continue;
            if (groups[b].some(k => touches(seen, rho, drops[k]))) {
              if (rho > maxSingle + 0.01) builds.push(`pisarat ${A.map(k => k + 1).join('+')} yhdistettävä kokoon ${rho.toFixed(1)} ennen kuin ne pääsevät pisaroiden ${groups[b].map(k => k + 1).join('+')} luo`);
              groups[a] = A.concat(groups[b]);
              groups.splice(b, 1);
              changed = true;
              break outer;
            }
          }
        }
      }
    }

    const shares = groups.map(G => G.reduce((s, k) => s + vol(drops[k][2]), 0) / V0).sort((a, b) => b - a);
    const keep = shares[0];

    // how many of the smallest drops could be lost and still pass
    const sortedVol = drops.map(d => vol(d[2])).sort((a, b) => a - b);
    let spare = 0, lost = 0;
    for (const v of sortedVol) { if ((lost + v) / V0 <= L.maxLoss + 1e-9) { lost += v; spare++; } else break; }

    const risks = [];
    drops.forEach(([x, y, r], k) => {
      for (const g of gaps) {
        const dist = g.side === 'l' ? x : g.side === 'r' ? W - x : g.side === 't' ? y : H - y;
        const along = g.side === 'l' || g.side === 'r' ? y : x;
        if (dist < r + 6 && along > g.a - r && along < g.b + r) { risks.push(`pisara ${k + 1} alkaa reuna-aukon vieressä`); break; }
      }
      if ((L.suns || []).some(([sx, sy, sr]) => Math.hypot(x - sx, y - sy) < sr)) risks.push(`pisara ${k + 1} alkaa auringossa`);
      if ((L.moss || []).some(([mx, my, mw, mh]) => x >= mx && x <= mx + mw && y >= my && y <= my + mh)) risks.push(`pisara ${k + 1} alkaa sammaleessa`);
    });

    // groups that can never join the main one must leave the leaf (a hole or a rim gap), or the level never ends
    if (groups.length > 1) {
      const exits = (L.drains || []).length + gaps.length;
      risks.push(exits ? `${groups.length - 1} ryhmää jää erilleen: ne on pudotettava reikään tai aukosta`
                       : `${groups.length - 1} ryhmää jää erilleen eikä tasolla ole reikää tai aukkoa niiden pudottamiseen`);
    }

    return {
      level: i + 1, name: L.name,
      ok: keep >= need - 1e-9 && (groups.length === 1 || (L.drains || []).length + gaps.length > 0),
      keep, need, groups: groups.length, spare,
      corners: [...new Set(gaps.filter(g => g.corner).map(g => g.corner))].length,
      sideGaps: gaps.filter(g => !g.corner).length,
      builds, risks,
    };
  }

  window.pisaraAnalysis = {
    analyse,
    all() { const out = []; for (let i = 0; i < S.count; i++) out.push(analyse(i)); return out; },
  };
})();
