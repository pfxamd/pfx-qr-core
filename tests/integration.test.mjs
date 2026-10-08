import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowserQrCore } from '../dist/index.js';
const browserReady = typeof globalThis.document !== 'undefined'
  && typeof globalThis.HTMLCanvasElement !== 'undefined';
test('real vendor roundtrip: PNG generation and QR scanning', { skip: !browserReady && 'Requires a browser DOM/canvas runtime' }, async () => {
  const core = await createBrowserQrCore();
  const payload = 'https://example.org/pfx-qr-core?check=1';
  const png = await core.render({ payload, size: 512, margin: 24, foreground: '#000000', background: '#ffffff', correction: 'H', dotStyle: 'square' }, 'png');
  assert.equal(png.mimeType, 'image/png');
  assert.equal(await core.verify(new Blob([png.bytes], {type:png.mimeType}), payload), true);
});
