import test from 'node:test';
import assert from 'node:assert/strict';
import { QrCore, StylingGenerator, ScannerDecoder } from '../dist/index.js';
const doc={payload:'https://example.org',size:256,margin:16,foreground:'#000000',background:'#ffffff',correction:'H',dotStyle:'rounded'};
test('styling adapter maps document fields and exports SVG bytes', async () => {
  let options;
  class StubStyling {
    constructor(o) { options=o; }
    async getRawData(ext) { assert.equal(ext,'svg'); return new Blob(['<svg/>']); }
  }
  const artifact=await new StylingGenerator(StubStyling).render(doc,'svg');
  assert.equal(options.data,doc.payload);
  assert.equal(options.qrOptions.errorCorrectionLevel,'H');
  assert.equal(options.dotsOptions.type,'rounded');
  assert.equal(artifact.mimeType,'image/svg+xml');
  assert.equal(new TextDecoder().decode(artifact.bytes),'<svg/>');
});
test('png export supports Uint8Array and logo is optional', async () => {
  let options;
  class StubStyling { constructor(o){options=o;} async getRawData(){return new Uint8Array([137,80,78,71,13,10,26,10]);} }
  const artifact=await new StylingGenerator(StubStyling).render(doc,'png');
  assert.equal(artifact.format,'png');
  assert.equal(artifact.bytes[0],137);
  assert.equal(options.image,undefined);
});
test('scanner decodes image and distinguishes missing QR', async () => {
  const scanner={scanImage:async()=>({data:'hello'})};
  const dec=new ScannerDecoder(scanner);
  assert.equal(await dec.decode(new Blob(['image'])),'hello');
  assert.equal(await new ScannerDecoder({scanImage:async()=>{throw new Error('No QR code found');}}).decode(new Blob()),null);
  await assert.rejects(new ScannerDecoder({scanImage:async()=>{throw new Error('Unexpected failure');}}).decode(new Blob()),/Unexpected failure/);
});
test('core verifies decoded image equals expected payload', async () => {
  const core=new QrCore(new StylingGenerator(class {async getRawData(){return new Blob(['x']);}}),new ScannerDecoder({scanImage:async()=> 'match'}));
  assert.equal(await core.verify(new Blob(),'match'),true);
  assert.equal(await core.verify(new Blob(),'other'),false);
});
test('export rejects incorrect format and empty artifact', async () => {
  class BadStyling { async getRawData() { return new Blob(['not an image']); } }
  await assert.rejects(new StylingGenerator(BadStyling).render(doc,'png'), /invalid PNG/);
  await assert.rejects(new StylingGenerator(BadStyling).render(doc,'webp'), /invalid WebP/);
  await assert.rejects(new StylingGenerator(BadStyling).render(doc,'svg'), /invalid SVG/);
});
