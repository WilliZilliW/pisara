// Takes the Play Store phone screenshots with headless Chrome, driven over the DevTools protocol so the page is
// laid out exactly like a phone (360x720 CSS px at 3x = 1080x2160 px, touch). Headless Chrome's own --screenshot
// cannot do this: its window will not go narrower than about 500 px.
// Run through tools/kuvakaappaukset.sh, which builds the screenshot page first.
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const chrome = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9333;
const profile = path.join(root, '.chrome-kuvat');
const page = pathToFileURL(path.join(root, 'www', '_kuvat.html')).href;
const outDir = path.join(root, 'kauppa', 'kuvakaappaukset');
const scenes = ['valikko', 'sokkelo', 'aurinko', 'sammal', 'kehä', 'viimeinen', 'tulos'];
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });

try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); }
    catch { /* not up yet */ }
    if (!target) await sleep(200);
  }
  if (!target) throw new Error('Chrome ei käynnistynyt');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let nextId = 0;
  const waiting = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); } };
  const send = (method, params = {}) => new Promise(res => { const id = ++nextId; waiting.set(id, res); ws.send(JSON.stringify({ id, method, params })); });

  await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 720, deviceScaleFactor: 3, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  mkdirSync(outDir, { recursive: true });

  for (const [i, scene] of scenes.entries()) {
    await send('Page.navigate', { url: `${page}?kohtaus=${encodeURIComponent(scene)}` });
    await sleep(1500);   // load, set up the scene, let a few frames draw
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const file = path.join(outDir, `${i + 1}-${scene}.png`);
    writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
    console.log('  ' + path.relative(root, file));
  }
  ws.close();
} finally {
  browser.kill();
  await sleep(500);
  rmSync(profile, { recursive: true, force: true });
}
