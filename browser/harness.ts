import { createBrowserQrCore } from '../src/index.js';
import type { QrDocument, QrRenderFormat } from '../src/index.js';
declare global {
  interface Window {
    pfxTest: (format: QrRenderFormat, withLogo?: boolean) => Promise<{ mime: string; decoded: boolean; size: number }>;
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
  const decoded = await core.verify(new Blob([image.bytes], {type:image.mimeType}), payload);
  return {mime: image.mimeType, decoded, size: image.bytes.length};
};
