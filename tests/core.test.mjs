import test from 'node:test';
import assert from 'node:assert/strict';
import { encodePayload, validateDocument, QrCore } from '../dist/index.js';
const doc = { payload: 'https://example.com', size: 512, margin: 16, foreground: '#000000', background: '#ffffff', correction: 'H', dotStyle: 'square' };
test('Wi-Fi special characters are escaped', () => assert.equal(encodePayload({ kind:'wifi',security:'WPA',ssid:'A;B:C',password:'p,a\\b' }), 'WIFI:T:WPA;S:A\\;B\\:C;P:p\\,a\\\\b;H:false;;'));
test('mailto query encoding', () => assert.equal(encodePayload({kind:'email',address:'a@example.com',subject:'A & B'}),'mailto:a@example.com?subject=A+%26+B'));
test('URL schemes are restricted', () => assert.throws(() => encodePayload({kind:'url',value:'javascript:alert(1)'})));
test('valid document', () => assert.deepEqual(validateDocument(doc), {valid:true, errors:[], warnings:[]}));
test('contrast warning', () => assert.ok(validateDocument({...doc,foreground:'#eeeeee'}).warnings.length));
test('empty data rejected', () => assert.equal(validateDocument({...doc,payload:' '}).valid,false));
test('adapter injection and rendering', async () => {const core = new QrCore({render:async(_,format)=>({format,bytes:new Uint8Array([1]),mimeType:'image/svg+xml'})},{decode:async()=>doc.payload});assert.equal((await core.render(doc,'svg')).format,'svg');assert.equal(await core.verify(new Blob(), doc.payload),true);});
test('reject invalid option enums, impossible margin and oversized UTF-8 payload', () => {
  const base = {payload:'Hello',size:256,margin:16,foreground:'#000000',background:'#ffffff',correction:'H',dotStyle:'square'};
  assert.equal(validateDocument({...base, correction:'X'}).valid,false);
  assert.equal(validateDocument({...base, dotStyle:'invalid'}).valid,false);
  assert.equal(validateDocument({...base, margin:128}).valid,false);
  assert.equal(validateDocument({...base, payload:'🙂'.repeat(739)}).valid,false);
});
test('capacity changes with error correction level and UTF-8 byte length', () => {
  const payload = 'a'.repeat(1500);
  assert.equal(validateDocument({...doc,payload,correction:'L'}).valid, true);
  assert.equal(validateDocument({...doc,payload,correction:'M'}).valid, true);
  assert.equal(validateDocument({...doc,payload,correction:'Q'}).valid, true);
  assert.equal(validateDocument({...doc,payload,correction:'H'}).valid, false);
  assert.equal(validateDocument({...doc,payload:'🙂'.repeat(320),correction:'H'}).valid, false);
});

test('malformed runtime color values fail validation instead of throwing', () => {
  for (const invalid of [null, 123, {}, [], '#fff', '#GGGGGG']) {
    assert.doesNotThrow(() => validateDocument({...doc, foreground: invalid}));
    assert.equal(validateDocument({...doc, foreground: invalid}).valid, false);
    assert.equal(validateDocument({...doc, background: invalid}).valid, false);
  }
});
test('empty or malformed optional logos are rejected', () => {
  for (const invalid of ['', '   ', null, 2, {}]) {
    assert.equal(validateDocument({...doc, logo: invalid}).valid, false);
  }
});
test('QR capacity has exact correction-level boundaries', () => {
  const capacities = {L:2953, M:2331, Q:1663, H:1273};
  for (const [correction, max] of Object.entries(capacities)) {
    assert.equal(validateDocument({...doc, correction, payload:'a'.repeat(max)}).valid, true);
    assert.equal(validateDocument({...doc, correction, payload:'a'.repeat(max+1)}).valid, false);
  }
});
test('quiet zone, inverted colors and logo correction produce warnings', () => {
  assert.ok(validateDocument({...doc, margin:0}).warnings.some(s => s.includes('quiet zone')));
  assert.ok(validateDocument({...doc, foreground:'#ffffff', background:'#000000'}).warnings.some(s => s.includes('Light modules')));
  assert.ok(validateDocument({...doc, logo:'data:image/png;base64,abcd', correction:'L'}).warnings.some(s => s.includes('Logos')));
});
