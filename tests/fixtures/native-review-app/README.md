# Archived native app review fixtures

These are ten byte-for-byte copies from the Vesslo app task's `Docs/fixtures/native-review/delivery-current` session. They are synthetic native-harness records, not the user's installed-app inventory. `provenance.json` records each source path, original runtime evidence path, byte count, and SHA-256. Each source hash was checked against the app's `fixture-index.json` before copying.

This is one archived publisher session: `F0C6ECD4-04F9-4B02-933C-332AABCE636C`. Export, selected requests, accepted receipts, Return-without-confirmation, cancellation, and closed receipts are preserved as separate original files. Receipts from other sessions are not merged into a fabricated sequence. The final envelope contains two requests, so tests correlate by request identity rather than assuming array index zero.

The fixture timestamps are historical. Request construction injects each saved `request.createdAt`; receipt parsing injects the recorded final update time `2026-09-10T19:56:35.985Z`. Expiry tests advance that injected clock. The archived requests are not fresh requests to replay against a running app, and recorded paths/PIDs are never opened, checked, or reused by these tests.

`tests/native-harness-contract.test.cjs` uses the production TypeScript parser, request builder, URL encoder/parser, receipt parser, binding and transition checks, plus the pure receipt Markdown renderer with native APIs/hooks mocked. Source provenance and immutable bytes are checked locally. The checks prove compatibility with these archived app-generated artifacts. They do not launch Vesslo/Raycast, exercise a live URL receiver, execute Homebrew, or prove an installed update. `accepted` remains awaiting review; `cancelled` remains cancelled. Neither is displayed as verified completion.

Run through the existing `scripts/test.cjs` compilation conventions (`VESSLO_TEST_BUILD` and `NODE_PATH`), selecting only `tests/native-harness-contract.test.cjs` for a focused run. The normal test runner also discovers this `.test.cjs` file automatically.
