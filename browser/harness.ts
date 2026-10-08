import { createBrowserQrCore } from '../src/index.js';
import type { QrDocument, QrRenderFormat } from '../src/index.js';

const payload = 'https://example.org/pfx-qr-core?check=1';
const makeDocument = (withLogo: boolean): QrDocument => ({
  payload, size: 512, margin: 24, foreground: '#000000', background: '#ffffff',
  correction: 'H', dotStyle: 'square',
  ...(withLogo ? { logo: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="red"/></svg>') } : {}),
});

declare global {
  interface Window {
    pfxTest: (format: QrRenderFormat, withLogo?: boolean) => Promise<{ mime: string; decoded: boolean; size: number }>;
    pfxPrepareSvg: () => Promise<{ mime: string; size: number }>;
    pfxVerifyScreenshot: (bytes: number[]) => Promise<boolean>;
  }
}

window.pfxTest = async (format, withLogo = false) => {
  if (format === 'svg') throw new Error('Use pfxPrepareSvg and a browser screenshot for SVG');
  const core = await createBrowserQrCore();
  const image = await core.render(makeDocument(withLogo), format);
  const decoded = await core.verify(new Blob([Uint8Array.from(image.bytes)], {type:image.mimeType}), payload);
  return {mime: image.mimeType, decoded, size: image.bytes.length};
};

window.pfxPrepareSvg = async () => {
  const core = await createBrowserQrCore();
  const image = await core.render(makeDocument(false), 'svg');
  const markup = new TextDecoder().decode(image.bytes);
  const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
  if (parsed.querySelector('parsererror') || parsed.documentElement.localName !== 'svg') {
    throw new Error('Invalid exported SVG');
  }
  const rendered = document.importNode(parsed.documentElement, true);
  rendered.setAttribute('id', 'qr-svg');
  rendered.setAttribute('width', '512');
  rendered.setAttribute('height', '512');
  document.body.appendChild(rendered);
  return {mime:image.mimeType, size:image.bytes.length};
};

window.pfxVerifyScreenshot = async (bytes: number[]) => {
  const core = await createBrowserQrCore();
  return core.verify(new Blob([Uint8Array.from(bytes)], {type:'image/png'}), payload);
};
