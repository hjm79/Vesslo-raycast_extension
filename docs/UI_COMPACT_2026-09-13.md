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

The compact UI candidate passes 329/329 tests, strict TypeScript checking, source lint and the seven-command distribution build. Native fixture assertions were updated for smaller headings while retaining explicit unconfirmed/never-verified checks. The final text polish shortens the check instruction and suppresses duplicate `46 of 46` counts.

Latest test log: `/tmp/vesslo-raycast-ui-tests-polished-20260913.log`.

## Native observations and installation

The first compact UI candidate was installed to `/Users/hjm/.config/raycast/extensions/vesslo` after a complete mirror of that extension directory. All 16 installed runtime files matched the built candidate. The observed Vesslo executable, protected original checker, export and receipt files remained unchanged at installation.

Backup: `/Users/hjm/Documents/Vesslo-Backups/RaycastUI-20260913-h2b8ewl9/extension`.

Evidence directory: `/var/folders/t2/5y2r7zds0s1b3bl6w9t_y__r0000gn/T/VessloRaycastUICloseout-20260913-h2b8ewl9`.

1. Bulk Homebrew Update: the actual list showed compact version/review rows without the large UPDATE or Homebrew pills. The current snapshot was review-only; no new request or update was sent.
2. Homebrew Requests: existing KeyCastr request `42733EA6-B861-4389-B98C-19AD927FBAA8` showed a small Completed heading with requested `0.10.5 → 0.11.1` and `/Applications/KeyCastr.app` above the fold. Existing rejected/cancelled history remained visible. This re-displays the already verified update; it is not another update.

![Compact Homebrew list](/var/folders/t2/5y2r7zds0s1b3bl6w9t_y__r0000gn/T/VessloRaycastUICloseout-20260913-h2b8ewl9/01-bulk-after.png)

![Compact existing receipt](/var/folders/t2/5y2r7zds0s1b3bl6w9t_y__r0000gn/T/VessloRaycastUICloseout-20260913-h2b8ewl9/02-receipt-after.png)

## Current continuation state

The Mac locked during Action-menu interaction checks, and automatic unlock failed. The user was asked to unlock. Menu activation and final text-polish installation/replay remain pending; they are not claimed as passed. App root-binding native harness, updated Installer delta checks and observed TCC error reporting are being prepared in the app task. The separate TCC probe has been built but has performed zero permission queries.

Public release, Store submission and publication were not performed.
