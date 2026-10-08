import type { QrDecoder } from '../contracts/types.js';
export interface ImageScanner {
  scanImage(image: Blob, options?: { returnDetailedScanResult?: boolean }): Promise<string | { data: string }>;
}
/** Input Blob stays in-memory: this module never uploads content. */
export class ScannerDecoder implements QrDecoder {
  constructor(private readonly scanner: ImageScanner) {}
  async decode(image: Blob): Promise<string | null> {
    try {
      const output = await this.scanner.scanImage(image, { returnDetailedScanResult: true });
      return typeof output === 'string' ? output : output.data;
    } catch (err) {
      if (err instanceof Error && /no qr code found/i.test(err.message)) return null;
      throw err;
    }
  }
}
