import { QrCore } from './ports.js';
import { StylingGenerator, type StylingConstructor } from './styling.js';
import { ScannerDecoder, type ImageScanner } from './scanner.js';
/** Lazy-load vendor libraries. Browser bundlers resolve them after npm install. */
export async function createBrowserQrCore(): Promise<QrCore> {
  const [{ default: QRCodeStyling }, { default: QrScanner }] = await Promise.all([
    import('qr-code-styling'), import('qr-scanner'),
  ]);
  return new QrCore(
    new StylingGenerator(QRCodeStyling as unknown as StylingConstructor),
    new ScannerDecoder(QrScanner as ImageScanner),
  );
}
