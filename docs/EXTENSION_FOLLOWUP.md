# Extension-only follow-up — 2026-09-10

## Scope and preserved app work

The authoritative extension clone remains `af13e51fb64eaaa181af89395000bbd6a9b88f2e` plus the first implementation bundle in `raycast-extension-work`. All further work is local and uncommitted. This report describes follow-up work, not pre-existing commits or the earlier 71-test bundle as new work.

The earlier app-side authorization was withdrawn during this session. Swift-writing agents were interrupted. Four incomplete files remain in the separately prepared app snapshot and were not reset/restored/deleted; no Swift build or tests were run. See [the exact stopped-work paths](OWNERSHIP_STOP_REPORT.md). The main Vesslo task received those paths and [the minimum unresolved interface requirements](APP_INTERFACE_REQUIREMENTS.md).

## Extension changes

- `src/review-apps.tsx`, `utils/review-filter.ts`, `utils/audit-review.ts`: a read-only Review Apps command using current security, source-check and management export fields. Deleted history and a plain `updateAvailable` marker do not become review findings. Search and detail share active reasons and human-readable labels; inactive source reasons are not searchable as active findings.
- `src/search-apps.tsx`, `utils/search-filter.ts`: Bundle ID matching, explicit search-field selection, memo match excerpts, and native filtering disabled so memo/Bundle ID matches survive. Tag actions update both the visible query and its scope. Excerpt positioning normalizes repeated whitespace consistently.
- `components/SharedAppListItem.tsx`, `components/AppActions.tsx`: separate review details from update-version accessories and provide an explicit review-only action mode. Review Apps starts with Open in Vesslo; update, App Store dispatch and app-launch actions are absent. Other commands keep their existing shared action policy.
- `package.json`, generated `raycast-env.d.ts`, README and top changelog entry: register/document the fifth command and fixture scripts. Dependency versions and lockfile are unchanged.
- `scripts/prepare-ui-fixture.cjs`, `scripts/verify-ui-fixture.cjs`, `scripts/ui-fixture/*`, `tests/ui-fixture.test.cjs`: synthetic-data builds, inert native action adapter, source/artifact checks and callback execution against a native API denial proxy. See [fixture usage and limits](UI_FIXTURE_VALIDATION.md).

## Review findings addressed

Read-only Review Apps initially inherited an executable first action; this was removed using an explicit review-only mode and command-action regression coverage. Two additional fixtures cover search by visible audit labels versus hidden inactive reasons, and repeated-space memo excerpt positioning. The first TypeScript compile caught an empty-array inference in `flatMap`; an explicit result generic resolved it. No unresolved occurrence of those failures is being carried forward.

## Validation on the final extension source

- `npm test`: **102/102 pass**, no skipped tests. Includes the earlier consumer suite, new Review/Search regressions, and 14 fixture-harness cases/subcases covering 9 scenarios × 5 commands.
- Full `npm run lint`: pass, including manifest, icons, metadata, ESLint and Prettier.
- `npm run build:check`: pass, all five entry points and TypeScript validation.
- `git diff --check`: pass. Dependency versions and lockfile remain unchanged.
- Native Raycast used separately named fixtures with synthetic data; runtime JS/package/assets were copied from verified output and their hashes compared before entry. The original extension registration was not replaced.
- Actual UI: Bundle ID-only and memo-only matches; matching memo excerpts; three review categories with visible reason search; read-only review action menu; source-grouped update counts and historical/current skip behavior; Homebrew batch limitation guidance; tag counts, push navigation, empty transition and successful return; stale banner and review-only row actions.
- A 240-app native fixture stayed open for more than 40 seconds (11:25:21–11:26:02 UTC observation window). Search remained responsive afterward; no warning/error/repeated-render entries appeared in its fixture development log. This is an observed runtime check, not a native render-count measurement. The native Name-field dropdown also excluded a Bundle ID-only match as expected.
- The initial native Review detail layout crowded app names with update/source badges. The final review-only rows omit those extra badges/subtitle; the revised layout and read-only action menu were rechecked in native Raycast.
- Explicit update, copy and bulk-review key/click actions in the initial fixture produced only `SIMULATED` intent records. The checked fixture has no production data reader, app/URL opener, Finder/Clipboard capability or process/network module.

Native checks were in the current dark appearance. Light appearance, native permission/malformed/missing variants, real file access and real Vesslo handoff were not exercised in native Raycast; fixture VM and existing file-reader tests cover their respective synthetic and filesystem cases. No live updater test was run.

## Fixture cleanup

The five separately named registrations used in this follow-up were uninstalled through Raycast with **Keep Settings**, and their development processes were stopped. A `[FIXTURE]` search no longer listed fixture commands. The earlier `Vesslo Contract Smoke 22c7` registration was still cached despite its prior generated directory removal; it was also uninstalled with Keep Settings and its command disappeared. The two existing Vesslo command registrations remain visible. Verified generated sources and reports remain in the extension work clone.

## Main-task delivery

The ownership-stop paths and minimum app interface requirements were sent successfully earlier in this session. The final completion-report send failed because destination task `01a02d0c-23ee-73b3-9a71-f4186876d606` had been archived. It was not unarchived; this report and validation logs are the final handoff artifacts.

## Completion boundary

Homebrew-only batch execution and request/result receipts remain unresolved app dependencies. Bulk Homebrew Update is still a restricted intermediate state with review guidance and individual handoffs. It is not a restored batch feature. No speculative endpoint was added or invoked.

There was no commit, push, publish, release, original-repository reflection, or actual update test in this follow-up. The earlier real-data BusyCal handoff incident remains recorded in [the first bundle report](CONSUMER_SAFETY.md); synthetic fixture evidence does not erase or replace that incident.

워킹 디렉토리에만 수정, 커밋 안 함.
