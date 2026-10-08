import { createBrowserQrCore } from '../src/index.js';
import type { QrDocument, QrRenderFormat } from '../src/index.js';

declare global {
  interface Window {
    pfxTest: (format: QrRenderFormat, withLogo?: boolean) => Promise<{ mime: string; decoded: boolean; size: number }>;
  }
}

async function scannerReadyBlob(source: Blob, format: QrRenderFormat): Promise<Blob> {
  if (format !== 'svg') return source;
  // QR scanners need bitmap pixels. Rasterize vector output before decoding.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source);
  } catch (error) {
    const svg = await source.text();
    const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const parserErrors = parsed.querySelectorAll('parsererror');
    throw new Error('SVG bitmap decode failed: ' + String(error) + '; XML errors: ' + Array.from(parserErrors).map(el => el.textContent).join(' ') + '; SVG prefix: ' + svg.slice(0, 1200));
  }
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context unavailable');
    context.drawImage(bitmap, 0, 0);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('SVG rasterization failed')), 'image/png'));
  } finally {
    bitmap.close();
  }
}

window.pfxTest = async (format, withLogo = false) => {
  const core = await createBrowserQrCore();
  const payload = 'https://example.org/pfx-qr-core?check=1';
  const logo = withLogo
    ? 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="red"/></svg>')
    : undefined;
  const doc: QrDocument = {
    payload, size: 512, margin: 24, foreground: '#000000', background: '#ffffff',
    correction: 'H', dotStyle: 'square', ...(logo ? {logo} : {}),
  };
  const image = await core.render(doc, format);
  const output = new Blob([Uint8Array.from(image.bytes)], {type:image.mimeType});
  const decoded = await core.verify(await scannerReadyBlob(output, format), payload);
  return {mime: image.mimeType, decoded, size: image.bytes.length};
};
