import type { QrDocument, QrValidation } from '../contracts/types.js';
const hex = /^#[0-9a-fA-F]{6}$/;
const maxBytePayload: Record<'L' | 'M' | 'Q' | 'H', number> = { L: 2953, M: 2331, Q: 1663, H: 1273 };
function luminance(color: string): number {
  const channels = [1, 3, 5].map((i) => {
    const v = parseInt(color.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}
export function validateDocument(doc: QrDocument): QrValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (typeof doc.payload !== 'string' || !doc.payload.trim()) errors.push('Payload cannot be empty');
  if (typeof doc.payload === 'string' && doc.correction in maxBytePayload &&
      new TextEncoder().encode(doc.payload).length > maxBytePayload[doc.correction as keyof typeof maxBytePayload]) {
    errors.push('Payload exceeds QR byte capacity at the selected error correction level');
  }
  if (!Number.isInteger(doc.size) || doc.size < 128 || doc.size > 4096) errors.push('Size must be an integer from 128 to 4096');
  if (!Number.isInteger(doc.margin) || doc.margin < 0 || doc.margin > 128) errors.push('Margin must be an integer from 0 to 128');
  if (typeof doc.foreground !== 'string' || typeof doc.background !== 'string' || !hex.test(doc.foreground) || !hex.test(doc.background)) errors.push('Colors must use #RRGGBB');
  if (doc.margin === 0) warnings.push('Missing quiet zone may affect scanning');
  if (Number.isFinite(doc.size) && Number.isFinite(doc.margin) && doc.margin * 2 >= doc.size) errors.push('Margin must leave space for the QR symbol');
  if (!['L','M','Q','H'].includes(doc.correction)) errors.push('Invalid error correction level');
  if (!['square','rounded','dots','classy','classy-rounded','extra-rounded'].includes(doc.dotStyle)) errors.push('Invalid dot style');
  if (doc.logo !== undefined && (typeof doc.logo !== 'string' || !doc.logo.trim())) errors.push('Logo must be a non-empty string when provided');
  if (doc.logo && doc.correction !== 'H') warnings.push('Logos work best with high error correction');
  if (typeof doc.foreground === 'string' && typeof doc.background === 'string' && hex.test(doc.foreground) && hex.test(doc.background)) {
    const a = luminance(doc.foreground), b = luminance(doc.background);
    const contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (contrast < 4.5) warnings.push('Low contrast may affect scanning');
    if (a > b) warnings.push('Light modules on dark backgrounds may scan poorly');
  }
  return { valid: errors.length === 0, errors, warnings };
}
