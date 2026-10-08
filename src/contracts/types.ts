export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';
export type QrRenderFormat = 'svg' | 'png' | 'webp';
export type QrDotStyle = 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded';
export interface QrDocument {
  readonly payload: string;
  readonly size: number;
  readonly margin: number;
  readonly foreground: string;
  readonly background: string;
  readonly correction: QrErrorCorrection;
  readonly dotStyle: QrDotStyle;
  readonly logo?: string;
}
export interface QrArtifact { readonly format: QrRenderFormat; readonly bytes: Uint8Array; readonly mimeType: string }
export interface QrGenerator { render(document: QrDocument, format: QrRenderFormat): Promise<QrArtifact> }
export interface QrDecoder { decode(image: Blob): Promise<string | null> }
export interface QrValidation { readonly valid: boolean; readonly errors: readonly string[]; readonly warnings: readonly string[] }
