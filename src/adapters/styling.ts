import type { QrArtifact, QrDocument, QrGenerator, QrRenderFormat } from '../contracts/types.js';
export interface StylingInstance {
  getRawData(extension: QrRenderFormat): Promise<Blob | Uint8Array | ArrayBuffer | null>;
}
export type StylingConstructor = new (options: Record<string, unknown>) => StylingInstance;
const mime: Record<QrRenderFormat, string> = {
  svg: 'image/svg+xml', png: 'image/png', webp: 'image/webp',
};
export class StylingGenerator implements QrGenerator {
  constructor(private readonly Styling: StylingConstructor) {}
  async render(doc: QrDocument, format: QrRenderFormat): Promise<QrArtifact> {
    const options: Record<string, unknown> = {
      type: format === 'svg' ? 'svg' : 'canvas',
      width: doc.size,
      height: doc.size,
      margin: doc.margin,
      data: doc.payload,
      qrOptions: { typeNumber: 0, errorCorrectionLevel: doc.correction, mode: 'Byte' },
      dotsOptions: { color: doc.foreground, type: doc.dotStyle },
      backgroundOptions: { color: doc.background },
    };
    if (doc.logo) {
      options.image = doc.logo;
      options.imageOptions = { imageSize: 0.25, margin: 4, hideBackgroundDots: true, saveAsBlob: true, crossOrigin: 'anonymous' };
    }
    const result = await new this.Styling(options).getRawData(format);
    if (!result) throw new Error('QR renderer returned no data');
    const bytes = result instanceof Blob ? new Uint8Array(await result.arrayBuffer())
      : result instanceof Uint8Array ? result : new Uint8Array(result);
    if (!bytes.length) throw new Error('QR renderer returned empty data');
    assertArtifactFormat(bytes, format);
    return { format, mimeType: mime[format], bytes };
  }
}
export function assertArtifactFormat(bytes: Uint8Array, format: QrRenderFormat): void {
  if (format === 'png') {
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (!signature.every((value, index) => bytes[index] === value)) throw new Error('QR renderer returned invalid PNG data');
  } else if (format === 'webp') {
    const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
    if (ascii(0, 4) !== 'RIFF' || ascii(8, 12) !== 'WEBP') throw new Error('QR renderer returned invalid WebP data');
  } else {
    const start = new TextDecoder().decode(bytes.subarray(0, 512)).replace(/^\uFEFF/, '').trimStart();
    if (!/^(<\?xml[^>]*>\s*)?<svg\b/i.test(start)) throw new Error('QR renderer returned invalid SVG data');
  }
}
