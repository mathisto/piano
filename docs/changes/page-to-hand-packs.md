# Page to Hand pack format

6 Nov 2026. The owner confirmed there are no distributed `.pfpack` files to preserve. Carrying that Piano Forte name into the new product would create a permanent compatibility cost for no user benefit, so this replaces the old format instead of migrating it.

## Changed

- A Page to Hand pack is a `.pthpack` file: “Page to Hand pack.” Bare `.pth` was rejected because Python already uses that extension for path-configuration files.
- The JSON format marker is `"pth": 1`; the parser rejects the old `"pf": 1` dialect.
- Shared files use `application/vnd.page-to-hand.pack+json`.
- iPadOS owns `io.mattkelly.pagetohand.pack`, exported as a `public.json` subtype with the `pthpack` extension and new MIME type.
- All nine bundled packs, both public packs, the generated public index, file pickers, share filenames, tests, specifications and device checklist use the new format. The URL fragment and stored `pack:<id>` records were already name-neutral and stay unchanged.

## Checks

- `npm run packs:check`
- `npx vitest run`
- `npx tsc --noEmit -p .`
- `npm run build`
- `E2E_ONLY='^(25|25b|25c) ' npm run e2e`
- iOS simulator archive with code signing disabled
- No boot-JS budget increase.
