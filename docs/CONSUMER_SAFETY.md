# Raycast Consumer Safety — First Implementation Bundle

## Source and ownership

- Implementation base: nested `af13e51fb64eaaa181af89395000bbd6a9b88f2e`.
- Actual checkout: `/Users/hjm/.codex/worktrees/22c7/Vesslo/raycast-extension-work`.
- Independent clone created with `git clone --no-local --no-hardlinks --no-checkout`, then detached at the requested commit. Original `.git` was not copied and original branches were not changed.
- Original reference: `/Users/hjm/Documents/git/all_application/Vesslo`, root `14b3916a3fcf00eedce2ffbf71844e0716cfa27b`; nested repository remained clean.
- Automatic outer worktree HEAD `dbb55b7bc80ab71e867fa00f7e3a23893bef2285` is not the extension implementation base. Its tracked files were not edited.
- No Swift, Xcode project, original documentation, protected `UpdateCheckService.swift`, or website source edits. No commit, push, publish, upstream merge, reset, restore, or rebase.

## Logic changes

| Area                 | Files                                                                                      | Policy                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Export compatibility | `types.ts`, `utils/data.ts`, `utils/app-policy.ts`                                         | Current/legacy/unsupported per-app classification; raw skip metadata retained; invalid structure fails closed                                            |
| Visibility           | `utils/update-filter.ts`                                                                   | Current boolean visibility is authoritative; current target skip, deleted and ignored suppress; broad historical skip only affects fully legacy fallback |
| Actions              | `utils/action-policy.ts`, `utils/action-execution.ts`, `utils/actions.ts`                  | Exact action/eligibility allowlist, path availability and unique Bundle ID; fresh disk check at click; per-app in-flight handoff gate                    |
| File state           | `utils/data-state.ts`, `utils/data-reader.ts`, `utils/useVessloData.ts`                    | Typed status, stat-first async reads, bounded stable-snapshot retry, last-good-data retention, late-response/unmount isolation                           |
| Tests                | `tests/*.test.cjs`, `tests/fixtures/current-app.json`, `scripts/test.cjs`, package scripts | Dependency-free Node runner after compiling production TS to disposable temp output                                                                      |

### Compatibility

The current Swift producer has no `schemaVersion`. An explicit unrecognized schema version fails as malformed until a version is agreed. Apps with all current contract fields absent are legacy. Partial or malformed current fields never fall back to executable legacy behavior. Legacy rows may be reviewed using target-version and historical skip filtering, but cannot initiate updates.

Current visibility remains separate from execution: a visible `refreshRequired` or unknown action stays in Updates under Review Required. Hidden refresh/adoption/unknown states remain explicit review guidance in Search/Tag. `auditGroups`, security/management reasons, source-health warnings and source badges are display-only; they do not authorize or suppress updates.

| Action/eligibility pair                                       | Consumer behavior                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------- |
| `runBrew` / `executableUpdate.homebrew`                       | Individual Vesslo handoff, valid cask required                    |
| `runSparkle` / `executableUpdate.sparkle`                     | Individual Vesslo handoff                                         |
| `runAppStore` / `executableUpdate.appStore`                   | Individual Vesslo handoff, numeric App Store ID required          |
| `openInstaller` / `manualInstallerUpdate`                     | Individual Vesslo handoff; Vesslo owns installer and verification |
| `openAppStore` / `appStoreManualUpdate`                       | Open validated App Store page, not an update-completion action    |
| `refreshRequired`, `adoptAndUpdate`, unsupported/unknown pair | Review/recheck in Vesslo                                          |
| Homebrew bulk                                                 | Review-only; no batch dispatch                                    |

`ready` requires readable, structurally valid JSON and a valid timestamp less than 24 hours old and not in the future. Missing or invalid timestamps stay stale; no current time is synthesized. File failures preserve the last readable snapshot with nonready status. A failure invalidates the metadata cache, so metadata equality cannot restore ready without another successful read.

Polling compares device/inode/size/mtime/ctime before reading JSON. It rechecks the export after the read and after asynchronous app-path checks. Replacement retries are bounded. Unchanged metadata avoids JSON read/parse; path availability and clock freshness are still checked. Actions force a read even when metadata is identical. This is not a producer-issued revision or cryptographic file identity guarantee.

Deleted records remain in `data.apps` but are excluded from ordinary search/tag aggregation. Nondeleted records with unavailable paths remain visible for review. Open/Finder require ready state, an absolute `.app` directory path, and successful availability checks; they are revalidated on use. These checks are availability checks, not code-signature verification.

Individual handoff matches the displayed app UUID, Bundle ID, path, installed version, target version, action, eligibility, cask and App Store ID against a fresh export. The current Vesslo receiver selects the first nondeleted Bundle ID match, so duplicate matches disable both targeted update and detail navigation. The receiver then uses its current automatic route; the existing URL cannot pin source/target version or return a completion receipt. The extension never reports an update as completed.

## UI changes, recorded separately

`components/AppActions.tsx` and `components/SharedAppListItem.tsx` now serve Search, Updates, Tag, and individual Bulk rows. `components/DataStateNotice.tsx` displays retained-data/failure status and refresh guidance. Updates keeps its audit-detail preview and adds a Review Required group. Bulk has explicit review-only guidance. Search uses a controlled query so tag actions update visible text. Tag detail uses native push navigation, preserving back navigation when the selected tag becomes empty. These UI changes are separate from the logic change set above; no commits were created.

Store screenshots were not regenerated. This working-copy implementation has not been published or installed over the user's existing Vesslo extension.

## Validation performed in this session

- `npm test`: 71/71 pass, no skipped tests. Covers historical/current skip, unknown/nonexecutable actions, deleted/missing paths, timestamp missing/invalid/future/expired, file absence/corruption/permission denial, atomic replacement, equal timestamp, late response/dispose, failed-read recovery, action drift and in-flight gate, and rendered command-action parity.
- `npm run typecheck`: pass.
- `npm run lint:source`: pass.
- `npm run lint`: pass, including manifest, icons, metadata, ESLint and Prettier. One final sandbox attempt encountered public Raycast schema/author DNS failure; the network-enabled retry passed.
- `npm run build:check`: pass (`ray build --environment dist --output dist --non-interactive`), all four entry points.
- `git diff --check`: pass.
- `skipLibCheck=false`: fails on existing Node Buffer/Uint8Array and React `scheduler/tracing` declarations. The same errors were reproduced using the unmodified original nested repository. No dependency upgrades or new skip settings were added.
- Live export read after the UI incident below: 212 apps, 11 deleted records, `updateCount=83`, Swift boolean visible=83, consumer visible=83; ready, zero unavailable nondeleted paths. See `current-export-check.json`. The previous 82-count snapshot was not silently treated as current. Historical-skip mismatch is absent in this live snapshot and covered by fixtures.
- Source/dependency checks did not run `brew`, `mas`, Terminal commands, delete apps, or change default handlers. No root Swift build was run because Swift sources were not changed.

## UI smoke incident and limits

A separately named temporary development extension `vesslo-contract-smoke-22c7` was built from a disposable copy to avoid replacing either existing Vesslo command registration. Real Raycast displayed the four development commands and Browse by Tag's 8 tags; opening `#menubar` displayed 6 app rows with the shared primary action.

During action-panel inspection, an Enter input executed the selected BusyCal row's **Update in Vesslo** action instead of opening the action panel. The extension displayed **Request Sent to Vesslo**. This exceeded the user's instruction not to run actual updates during this work and was immediately disclosed. It is not a successful non-destructive smoke test.

Follow-up read-only inspection found BusyCal still at the displayed version `2026.1.1` and no running Homebrew/mas update process. That does not prove the request was never accepted or that no short-lived effect occurred. The request launched `/Applications/Vesslo.app` (observed PID 6242) alongside the pre-existing Xcode Debug Vesslo (PID 83686). The newly launched installed process alone was terminated; the Xcode process remained. App startup updated the live export and audit cache files. No attempt was made to restore or overwrite those files.

The temporary Raycast develop process was stopped and its separately named generated build directory was removed. Further UI execution was stopped. Full real-UI verification of all four commands, empty-tag back navigation, stale/error displays, light/dark appearance and action menus remains incomplete. The command-render tests use mocked Raycast primitives; they are not actual Raycast UI evidence. The development log also recorded two repeated-render warnings (`ui-smoke-runtime.log`). Unchanged polling was still publishing fresh state objects; the final hook suppresses presentation-equivalent updates while refreshing its checked-state reference. This is covered by automated regression tests, but the runtime warning was not rechecked after the incident. Future UI smoke must make all external effects inert in an explicitly separate harness before driving keys near executable rows.

## App-owned follow-up contract (proposal, no endpoint implemented)

Homebrew-only batch remains blocked on an app-owned interface. Do not substitute the existing all-source `update-all` link.

1. Versioned review request with request ID, source fixed to Homebrew, explicit app UUID/Bundle ID/path targets and target/snapshot identity.
2. App revalidation of inventory identity, source, skip/ignore/deleted state, current eligibility and existing execution. Never widen to unrequested apps or another source.
3. Review/readiness UI showing accepted targets and excluded/changed reasons, followed by app-side confirmation and coordinator admission/lease/preflight.
4. Duplicate request, expiration, cancellation and app-restart policy.
5. Atomic structured request/target receipts distinguishing accepted/rejected/running/verificationPending/completed/failed/cancelled. Only authoritative post-verification can emit completed.
6. Export schema version plus publisher session/monotonic revision and completed-check phase to support reliable correlation and freshness.

After this contract, the next extension scope is read-only Review Apps using existing audit export, Bundle ID/search-scope/memo excerpts, and further tag navigation validation. File extension/UTI search and update/deletion history remain optional and depend on additive app export fields. Default-app changes, metadata writes and AI features remain outside scope.

워킹 디렉토리에만 수정, 커밋 안 함.
