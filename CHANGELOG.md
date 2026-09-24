# Vesslo Changelog

## Compact Lists and Request Results — Unreleased

- Replace repeated update/source pills with compact text and icons; retain warning reasons and exact-target review rules.
- Shorten check and selection summaries, keeping complete check reasons in View Check Details.
- Show compact receipt headings and target/version/path/results before technical metadata.
- Add View Technical Details with request and receipt JSON copying; keep cached, expired, pending and mixed results explicit.
- Use short request-list times and fix singular request counts.
- Validate 329 regression tests and the seven-command build. See [native UI validation](docs/UI_COMPACT_2026-09-13.md) for installation and interaction evidence.

## Target Readiness and Receipt Integration — Unreleased

- Consume schema 3 exports and require current Homebrew evidence for each exact target while keeping global source failures visible.
- Send request schema 2 with target evidence IDs and read receipt schema 2 without promoting legacy, cached, or expired records to current authority.
- Preserve selected-target identity, request-specific verification, and source/expiry revalidation through review and receipt follow-up.
- Verify the local seven-command extension and one installed-app Homebrew update with matching native UI, receipt, bundle, and Homebrew metadata.
- Commit the existing integration as `435cb7c`; public release and Store publication remain separate.

## Schema 2 App Integration — Unreleased

- Read the app's schema 2 export with session/revision/check-completion validation; legacy exports stay browse-only.
- Restore selected Homebrew review requests for 1–16 exact targets and use the same flow for individual Homebrew rows.
- Add Homebrew Requests for authoritative receipt phases and per-target results, including explicit cached, expired, and earlier-session history.
- Block Homebrew installer and mismatched-source fallbacks through generic update URLs; compare source sets after asynchronous reads.
- Import app contract fixtures with provenance and extend automated UI fixtures to seven commands and sixteen scenarios.
- These changes are local and unpublished. Installed app UI, TCC, Installer, and restart validation remain separate.


## Earlier Extension Safety and Six-Command Work

This section records the preceding patch stage. Its pending schema/batch/receipt work is superseded by the Schema 2 App Integration entry above.

- Add read-only Deleted Apps for existing `isDeleted` records, with identity/path copying and no app-open, Finder, restore, or update action. Deletion dates/reasons and verification activity are not invented.
- Add independent All Apps / Update Candidates filtering to Review Apps, with category and text filtering and review-first details.
- Add update source / Needs Review filters, sorting actions, version/source/identity details, and separate shown, visible, and declared counts.
- Explain Name, Bundle ID, Developer, Tag, and Memo search matches in text, and open exact tag matches through native push/back navigation.
- Add Reload Vesslo Data (`⌘R`) across all six commands. It rereads the export; it does not start an app update check. Completed-check time remains explicitly unavailable without producer data.
- Gate update handoff on consistent exported counts and visibility. Keep missing or incomplete count contracts reviewable with a visible warning.
- Use typed known action/eligibility values and conservative unknown handling, native installed-app file icons, bounded warning text, explicit UTC dates, and consistent source/count labels.
- Add matching Homebrew review-list copying and detailed inspection while preserving existing individual app actions. Selected-target batch submission still requires an app-owned interface.
- Check dependency declarations with `skipLibCheck: false`, repair compatible Node/React type packages, and add locked-install macOS CI for type checking, source lint, tests, and distribution build.
- Extend regression tests and isolated synthetic UI fixtures for all six commands. See [the completion report](docs/COMPLETION_2026-09-10.md) for validation and [the app handoff prompt](docs/VESSLO_APP_HANDOFF_PROMPT.ko.md) for unresolved producer/receiver work.
- This is an unpublished extension patch. App-contract completion, hosted CI, Store screenshots, and publication remain separate work.

## [Harden Consumer State and Action Policy] - {PR_MERGE_DATE}

### Fixed

- Preserve current update visibility when an older version was skipped.
- Distinguish stale, missing, malformed, and permission-denied exports and revalidate actions before handoff.
- Preserve deleted history while excluding it from normal search and tag counts.

### Improved

- Share explicit update/review policy across all commands and remove direct Homebrew, mas, and Terminal execution.
- Keep Homebrew batch operations review only until Vesslo supports scoped handoff.
- Add consumer, asynchronous file-state, action, and command-render regression tests.

## [Show Vesslo Review Warnings] - 2026-07-14

- Show Vesslo audit warnings as clear Security, Source Check, or Review badges in the updates list
- Add a review details preview with warning reasons, update-source health, and Vesslo action context
- Keep update actions anchored to Vesslo's eligibility export while preserving legacy exports

## [Align Update Actions with Vesslo Eligibility] - 2026-06-29

- Align update filtering with Vesslo's eligibility export so deleted, skipped, and ignored apps stay out of update views
- Use Vesslo's `isVisibleInUpdates`, `eligibilityKind`, and `primaryActionKind` fields when available, with legacy fallback only for older exports
- Limit bulk Homebrew updates to valid, unique cask tokens from Vesslo's visible Homebrew update candidates
- Separate Vesslo detail links from update links and validate App Store IDs before showing App Store or `mas` actions

## [Improve Safety and Data Accuracy] - 2026-03-23
- Added deleted/skipped/ignored app state to Raycast data export
- Updates list now excludes deleted, skipped, and ignored apps (aligned with Vesslo app)
- Deleted apps show "Open in Vesslo" instead of "Open App" action
- Added AppleScript command escaping for terminal actions
- Added input validation for cask tokens and App Store IDs
- Increased exec buffer limit for bulk updates

### Fixed
- Fixed potential crash when updating all Homebrew apps at once (`maxBuffer` limit exceeded by large brew output)
- Fixed duplicate app display in source-grouped Updates view for apps with multiple sources (e.g., Brew + App Store)
- Fixed keyboard shortcut conflict between Homebrew and App Store actions (`⌘⇧↩` and `⌘⇧T`)
- Fixed potential state update on unmounted component during data polling

## [Improve Store Listing] - 2026-02-16
- Keyboard shortcuts reorganized: Homebrew `⌘⇧↩` / `⌘⇧T`, App Store `⌘⇧O` / `⌘⇧M`
- Source grouping priority: Homebrew > Sparkle > App Store > Manual (no duplicates)
- Data hook encapsulation: internal `setData` no longer exposed externally

## [Initial Release] - 2026-02-15
- Added `Search Apps` command to find apps by name, developer, tag, or memo
- Added `View Updates` command to check for pending updates with Vesslo integration
- Added `Bulk Homebrew Update` command utilizing Vesslo deep links for safe batch updates
- Added `Browse by Tag` command to view apps grouped by custom tags
- Added real-time data refreshing synchronized with Vesslo app
- Integrated Vesslo deep links (`vesslo://`) for unified update management
