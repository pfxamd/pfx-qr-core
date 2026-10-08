import type { QrDecoder, QrDocument, QrGenerator, QrRenderFormat, QrArtifact } from '../contracts/types.js';
import { validateDocument } from '../validation/document.js';
/** Dependency inversion: actual vendor integrations are separate, independently versioned adapters. */
export class QrCore {
  constructor(private readonly generator: QrGenerator, private readonly decoder: QrDecoder) {}
  async render(document: QrDocument, format: QrRenderFormat): Promise<QrArtifact> {
    const result = validateDocument(document);
    if (!result.valid) throw new Error(result.errors.join('; '));
    return this.generator.render(document, format);
  }
  async verify(image: Blob, expected: string): Promise<boolean> {
    return (await this.decoder.decode(image)) === expected;
  }
}
