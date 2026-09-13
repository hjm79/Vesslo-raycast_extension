# Isolated UI fixture validation

The inert fixture harness keeps the extension's real command/component/policy code and `useVessloData` hook, then replaces the file reader and external actions in a separately generated tree. It does not read the user's export. All fixture apps use `com.example.vesslofixture.*` and `/__vesslo_fixture__/*.app`; icons are synthetic or empty. The separate [native TestHost adapter](#native-testhost-adapter) retains real private export/receipt IO and connects to the app's Test-only Review UI.

## Prepare and verify

```sh
npm run fixture:prepare -- --scenario ready-mixed
npm run fixture:verify -- /absolute/path/printed/by/prepare
```

Preparation builds with the installed esbuild and verifies the artifact. Neither command registers an extension, launches Raycast/Vesslo, nor dispatches update requests. No dependencies are downloaded. Each output is a new directory under `.ui-fixtures`; the existing Vesslo extension name and registration are not used.

Supported scenarios:

- `ready-mixed`: executable, manual, historical/current skip, deleted and audit rows.
- `review-actions`: refresh-required, unknown and legacy candidates.
- `stale-retained`, `missing-empty`, `malformed-retained`, `permission-denied-retained`.
- `path-unavailable`: missing, denied and unknown synthetic app paths.
- `tag-becomes-empty`: the selected tag loses its apps on the fixture timeline.
- `unchanged-polling-large`: 240 synthetic apps with stable data identity across polls.
- `count-mismatch`, `count-unverifiable`: contradictory counts and missing count authority.
- `display-edge-cases`: literal Markdown/URL-shaped text, bidi/control characters, long reasons, and exact versus prefix tags.
- `schema2-checking`: check-in-progress data cannot create a review request.
- `receipts-pending`, `receipts-completed`, `receipts-partial-failure`: synthetic authoritative phases and per-target results.

All seven commands, including `Deleted Apps` and `Homebrew Requests`, are built and exercised. Fixture manifest v2 records the historical implementation baseline separately from the actual current Git revision and exact source/artifact hashes, so a later legitimate commit does not disable CI. Verification still rejects a fixture prepared from a different revision or source contents. Native fixture subtitles include a unique run suffix to distinguish otherwise identical scenarios.

## Effect boundary

Generated `actions.ts` records review/update/open/Finder intents in memory and fixture logs. It cannot open URLs or run applications. The Raycast UI adapter replaces `Action.CopyToClipboard` with an intent recorder and forces Dropdown persistence off. Only explicitly allowed native UI primitives are available. The normal Homebrew helper's filesystem path probe is excluded; its pure token validation is preserved. The real Homebrew target validation and receipt parser are retained. URL encoding/decoding and the external executor are removed from the synthetic copy; receipt reads use an inert hook. Review submissions only record synthetic requests.

Source transforms, original hashes, fixed stub content, artifact file set, build graph, external imports and native API references are checked. Production data/action modules, process/filesystem/network access and real app/export paths are rejected. Native file icons are limited to the synthetic fixture app paths. The VM renderer denies native action capabilities and invokes callbacks across command/state fixtures. Identical tag destinations are visited once per render to avoid quadratic expansion of unopened navigation targets. This is a regression harness for these known generated sources, not a security sandbox for arbitrary malicious JavaScript.

The native formatter regression is checked separately: a VM property check does not prove how Raycast renders Markdown. URLs are permitted inside validated, single-line literal code spans only; active Markdown links/images/HTML and external image sources remain rejected. See [the earlier completion report](COMPLETION_2026-09-10.md) for earlier native observations and [schema 2 integration](SCHEMA2_INTEGRATION_2026-09-10.md) for the current boundary.

Inert fixture validation proves UI/action behavior with synthetic data and simulated effects. It does not prove real file permissions, Vesslo request reception, an installed app update, completion receipts, or native Raycast rendering. Earlier automated and native UI evidence are recorded separately in [the follow-up report](EXTENSION_FOLLOWUP.md).

Native rendering was separately checked on 2026-09-11 for the `receipts-partial-failure`, `receipts-pending`, and `schema2-checking` scenarios using verified artifacts and temporary registrations. See [the native schema 2 report](NATIVE_SCHEMA2_2026-09-11.md) for that run's observed flows, screenshots, effect boundaries, and cleanup. That historical run did not establish app reception; the separate connection below now covers TestHost reception and cancellation.

## Native TestHost adapter

The [native adapter preparer](../scripts/native-review/prepare.cjs) and [verifier](../scripts/native-review/verify.cjs) generate a separate extension with the original Bulk Homebrew Update and Homebrew Requests commands. They require an already running, explicitly isolated TestHost and its private manifest; they do not launch or register either app.

```sh
node scripts/native-review/prepare.cjs --manifest /absolute/path/to/live/State/manifest.json --evidence-root /absolute/path/to/private/evidence
node scripts/native-review/verify.cjs /absolute/path/printed/by/prepare
```

The evidence directory must already exist with owner-only permissions. Outputs use unique `vesslo-native-review-*` names under `.ui-fixtures-native`. The generated extension reads the TestHost's actual private export and receipt files through the existing bounded readers. App-path availability is injected only for the three manifest targets: `/VessloSynthetic/Alpha.app`, `/VessloSynthetic/Beta.app`, and `/VessloSynthetic/Gamma.app`. Other app paths fail closed.

The original TypeScript sender constructs and validates the request. The [private transport](../scripts/native-review/transport.py) forwards the original URL bytes unchanged to the bound TestHost inbox; it never opens an OS URL. Manifest/session/PID/process-start/code-image checks bind delivery to the prepared host. The bridge executes verified Python source bytes with an explicit argument vector and isolated imports. Generic app, Finder, update, and clipboard effects remain disabled. Source transforms, hashes, imports, artifact membership, and a canonical rebuild's bundle bytes are checked before native use.

Transport ACK confirms only transport handling. An uncertain delivery attempt keeps the original request available for receipt follow-up without automatic resend. Only the app-owned receipt matched to the full original request supplies acceptance, cancellation, or other status.

The [2026-09-12 connection report](NATIVE_CONNECTION_2026-09-12.md) records the actual flow: Raycast's original bulk sender → identical URL bytes over the private bridge → Test Vesslo Review with three targets → Return without receipt change → native Cancel → revision 1 `accepted` to revision 2 `cancelled` in the same mounted Raycast receipt view, also visible in Homebrew Requests. The host recorded one delivery and zero executor calls. The temporary registration was removed, both existing Vesslo registrations were preserved, and the TestHost/private state root were cleaned up.

That run also passed 228 automated tests, full lint, and all seven command builds. It used the harness already supplied by the app task and required no app source change. It establishes TestHost reception, native review/cancellation, and private receipt propagation. Production installed-app URL handling, TCC, actual updates/installers, and release remain unverified; no completed-update receipt or real updater execution is claimed.
