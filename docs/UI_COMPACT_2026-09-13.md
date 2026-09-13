# Raycast compact UI and closeout — 2026-09-13

## Cause and scope

The supplied Bulk Homebrew Update screenshot repeated UPDATE beside a version change and repeated Homebrew source pills in a Homebrew-only command. Policy and audit review labels could also compete. The receipt screenshot used an H1 status and placed internal request/session/revision fields above target results.

The extension baseline is `af13e51`; its existing integration was committed as `435cb7c` on `codex/raycast-ui-closeout`. The compact UI was committed separately as `8f0388b`. App source and installed Vesslo are owned by the app task; public release is separate.

## Changes

- Shared rows show the version change once, use a check icon for selection, combine review reasons into one compact warning, and consolidate general source labels into neutral text. Homebrew-only rows omit repeated source labels. Security remains visible and all review reasons remain in tooltips/details.
- Check and selection summaries use plain text. View Check Details preserves the exact reason, global check failure and independent candidate/ready counts. The maximum selection, expiry, source, identity and request execution rules are unchanged.
- Receipt status uses a compact H3 heading. Original target cask, requested versions, exact path, per-target result/reason and update time precede diagnostics. View Technical Details retains request/session/schema/revision/evidence/verification fields and offers original request/receipt JSON copying.
- Request lists show short local time and compact status instead of a full UUID. Current, earlier, cached and expired histories remain distinguishable. Request IDs remain searchable and copyable.

## Automated validation

The baseline passed 317/317 tests after correcting a test fixture that changed evidence expiry without advancing the state's checkedAt clock. No production readiness rule was changed for that correction.

The compact UI candidate passed 329/329 tests, strict TypeScript checking, source lint and the seven-command distribution build. Native fixture assertions were updated for smaller headings while retaining explicit unconfirmed/never-verified checks. The final text polish shortens the check instruction and suppresses duplicate `46 of 46` counts. These checks were not rerun during the subsequent native validation; no extension source changed in that turn.

Latest test log: `/tmp/vesslo-raycast-ui-tests-polished-20260913.log`.

## Native observations and installation

The final compact UI, including both short-copy adjustments, is installed at `/Users/hjm/.config/raycast/extensions/vesslo`. All 16 installed runtime files for seven commands match the built candidate, recorded in `runtime-final-installed.json` in the evidence directory. The complete original extension mirror and the preceding installed runtime were retained. The observed Vesslo executable, protected original checker, export and receipt hashes remained unchanged at installation.

The final post-validation comparison at `/private/tmp/VessloNativeCloseoutLedger-20260913/after-final-comparison-20260913.json` (SHA-256 `127cb7f5d578e089fc9b69cec7bde90237baaca18164539bb3355739a91acc4e`) was captured after the final PID `32077` checks and found zero differences and zero read errors across the installed Vesslo bundle's 134 entries and the observed checker, export, receipt and KeyCastr executable. Recorded content, stat fields excluding read access time, ACLs and extended attributes were unchanged. The final capture is `after-final-20260913.json` (SHA-256 `034aead55cf0be2676fd276e9697ea2dc044f087413cd1e450646593a88f3302`); the earlier comparison is retained. This covers those exact observations at capture time; it does not assert unchanged TCC state, registrations or unrelated operating data.

Backup: `/Users/hjm/Documents/Vesslo-Backups/RaycastUI-20260913-h2b8ewl9/extension`.

Evidence directory: `/var/folders/t2/5y2r7zds0s1b3bl6w9t_y__r0000gn/T/VessloRaycastUICloseout-20260913-h2b8ewl9`.

1. Bulk Homebrew Update: the final list showed compact version/review rows without the large UPDATE or Homebrew pills, the shortened check instruction and the nonduplicated app count. View Check Details opened the correct review-only reason, and Back returned to the list. No new request or update was sent.
2. Homebrew Requests: existing KeyCastr request `42733EA6-B861-4389-B98C-19AD927FBAA8` showed a small Completed heading with requested `0.10.5 → 0.11.1` and `/Applications/KeyCastr.app` above the fold. View Technical Details opened through the Actions popup and retained the exact request UUID, publisher session, schema, revisions and path; Back restored the result summary. Existing rejected/cancelled history remained visible. This re-displays the already verified update; it is not another update.
3. Search Apps and View Updates: actual rows showed neutral source labels while retaining version arrows and warnings.

The Actions popup was not exposed in the available accessibility tree. Its items were selected using coordinates from a fresh screenshot and the resulting views were checked. The earlier incomplete menu observations are superseded by these successful interactions; no product defect was established by the accessibility limitation.

![Final compact Homebrew list](/var/folders/t2/5y2r7zds0s1b3bl6w9t_y__r0000gn/T/VessloRaycastUICloseout-20260913-h2b8ewl9/03-bulk-final.png)

![Final compact existing receipt](/var/folders/t2/5y2r7zds0s1b3bl6w9t_y__r0000gn/T/VessloRaycastUICloseout-20260913-h2b8ewl9/05-receipt-summary-final.png)

The same evidence directory contains `04-receipt-technical-final`, `05-receipt-summary-final`, `06-check-details-final`, `07-search-apps-final` and `08-updates-final` screenshots and accessibility snapshots. Raw native records remain local and are not committed.

## App native closeout and remaining check

The user unlocked the Mac and the Raycast installation/menu checks above completed. App closeout at `670bdf3c69d907c5831be1d33c0133858a4381c9` produced 11 issue commits with exact-tree Debug builds and a clean worktree. Its 33-suite run passed 991 of 996 tests with five conditional skips and zero failures. The tested tree differs from that HEAD only in 80 Docs paths. Root independently verified the immutable delivery manifest and all 115 referenced file hashes/sizes, commit trees and build logs. These earlier test results are not counted as a new run.

- The Test-only root review harness verified cancellation, Return without approval, the approved sheet remaining visible and app-owned continuation after closing the review. Its final owner-dismissal fix is committed at clean app HEAD `e7f51dad4f1dfc13d8121c2be484b37d25febabc`, with **35/35 tests passed, zero skips/failures and a fresh successful Debug build**. Native host PID `32077` received exactly one actual Quit menu action while approved continuation was pending. The presentation owner disappeared, attached sheets and parent sheets were both zero, no modal remained, normal delegate termination occurred and the PID exited. Both owned drains were confirmed; fake mutations and forbidden executions were zero. Snapshot and CLI cleanup passed. There was no second Quit, manual sheet close or forced signal. **The isolated root native gate is complete.**
- Final root evidence: `/private/tmp/VessloNativeQuitFix-670bdf3-r5sewhfm/sheet-owner-prepared-root/native-quit-result.json`, SHA-256 `56f11bb2430126737891391593baf7926c208544722c2babd61848ac4e3af8a0`. The JSON and its hash were directly checked; all 15 checks passed. Its scope is the isolated Test host, not an installed production app replacement or launch.
- The separate Automation-denial probe's initial canonical-path preparation error occurred before any permission query. After correction, the actual probe returned `-1744 → 0`, an unexpected allow result rather than the required denial sequence. The app's Test-only probe identity pin was updated in `c4e2a27`, with 35 tests passed, one skipped and a successful Debug build. Actual OS denial and the associated Vesslo error replay remain unverified; these automated checks do not establish a successful denial test.
- The current Installer open-boundary test passed **1/1 with zero skips**, independently recorded in `/private/tmp/VessloInstallerNative-20260913-6yvbmns9/summary.json`. It opened the isolated test package; it did not install an update. The recovery-sheet keyboard test separately passed **1/1**.
- The additional restart run initially exposed a stale whole-object assertion. Its Test-only expectation correction was committed as `ccb9dc0`, with 53 tests passed, one skipped and a successful Debug build. A fresh opt-in run on `1fc0e26` then passed prepare and recover **1/1 each with zero skips**, using distinct PIDs `13416` and `13614`. Both hosts exited and all 99 files of the same Test app remained byte-identical. `/private/tmp/VessloNativeQuitFix-670bdf3-r5sewhfm/restart-runtime/verification.json` records all 14 checks passing. This is additional confirmed restart evidence; it does not replace or invalidate prior runs.

The preceding app candidate `1fc0e26` passed its three-suite run with **101 total, 99 passed, two opt-in skips and zero failures**, a separate Root/IO run **22/22**, and Debug build. These results, final `e7f51da` 35/35, the `c4e2a27` and `ccb9dc0` results, and the earlier 996-test closeout are separate runs and are not added together.

The only remaining additional native check is an actual OS Automation denial followed by strict replay of that observed denial in the Vesslo error UI. The current `-1744 → 0` probe result does not satisfy it.

### Earlier root termination failures retained as history

Original Test host PID `37382` remained alive after Quit and its closure record; identity-checked forced cleanup completed. The `e78abd7` candidate's 98 manifest references were independently verified, but actual Quit and Command-Q again left PID `79244` alive. Identity-bound SIGTERM timed out after 15 seconds and controlled release acknowledgement after 10 seconds. PID, start time, session, both code-image hashes and directory identities were rechecked with `fakeMutationCalls=0` and `forbiddenExecutionCalls=0`; only that owned host was stopped with SIGKILL and its absence confirmed. It produced no `closed.json`, so all fixtures were retained in place. Evidence: `/private/tmp/VessloNativeQuitFix-670bdf3-r5sewhfm/prepared-root/native-forced-stop.json`.

Candidate `1fc0e26` host PID `14142` completed owned shutdown and logged `sheetsFinished` and `finalTerminate` returning, but the real sheet remained visible after the first actual menu Quit. That first Quit failed. Closing the actual sheet and invoking Command-Q a second time allowed normal exit and verified CLI cleanup, with zero forced signals, fake mutations and forbidden executions. Evidence: `/private/tmp/VessloNativeQuitFix-670bdf3-r5sewhfm/followup-prepared-root/native-quit-result.json` and `native-cleanup-result.json`, plus screenshot `15-final-root-quit-still-present.png` in the Raycast evidence directory. These earlier failures and workaround cleanup are retained as history; final `e7f51da` independently passed a single actual Quit. No failure in installed Vesslo was reproduced by these Test-host observations.

## Production source, candidate and installation boundary

A universal Developer ID candidate containing the production stable sheet host is prepared from `670bdf3` at `/private/tmp/VessloRootSheetCandidate-670bdf3-55j9x1lp/export/Vesslo.app`, executable SHA-256 `39f23d6fe20b48f70b9fba03f20b036da777ae48f863c1ee68b51a8882d84be3`. It has not replaced or been launched as the installed app. Subsequent native probe, expectation and host-dismissal fixes are Test-only; their final native validation does not imply a new production installation. Existing installed `bdaad` and its verified KeyCastr completion remain valid.

Public release, Store submission and publication were not performed.

App closeout: `/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Docs/AppCloseoutValidation2026-09-13.md`. Immutable manifest: `/private/tmp/VessloAppCloseout-20260913/delivery-manifest.json`, SHA-256 `24eacb87d41123d95c25c582a60b0c97fcd9a8dddaf68476382ce2addd79ec07`. Independent verification: evidence directory `app-closeout-independent-verification.json`. These app source/Test additions are not claimed to be included in installed Vesslo `bdaad`.
