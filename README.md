# PFx QR Core

Modular QR code generation, styling, validation, scanning, and export library.

**Status:** 0.1.0-alpha.6; browser verification is in progress.

## Development

```bash
npm install
npm run verify
npx playwright install --with-deps chromium firefox
npm run test:browser
```

This core is intended to be reusable across web projects. Browser integration tests generate QR images and decode them with a separate scanning library. Do not use in production until the integration workflow passes.
