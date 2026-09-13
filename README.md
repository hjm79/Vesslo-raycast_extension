# Vesslo

<p align="center">
  <img src="assets/extension-icon.png" height="128">
  <h1 align="center">Vesslo</h1>
</p>

🌐 **Website**: [Vesslo](https://vesslo.top)
📦 **GitHub**: [Vesslo for macOS](https://github.com/hjm79/Vesslo-MacAppManager)

Search your Vesslo library, inspect exported update candidates, and review app records from Raycast.

## Requirements

- Vesslo must be installed on your Mac.
- The extension reads Vesslo's automatically generated `~/Library/Application Support/Vesslo/raycast_data.json`.
- Use **Reload Vesslo Data (`⌘R`)** in any command to reread that file. This does not ask Vesslo to check for updates. A recent export timestamp does not establish that an update check completed.

## Commands

### Search Apps

Search All Fields or choose Name, Bundle ID, Developer, Tag, or Memo. Results include textual match reasons and short memo excerpts. Browse a tag through native navigation: `#Work` matches that exact tag, and returning preserves your original search field and text.

### View Updates

View the candidates in Vesslo's export. The dropdown filters All Updates, Homebrew, Sparkle, App Store, Manual Installer, or Needs Review. The action menu sorts by source, name, or developer; search also matches versions, paths, cask tokens, and review reasons.

The summary distinguishes matching rows, visible exported candidates, and Vesslo's declared count. Missing or contradictory count data is shown explicitly. Versioned exports show the actual last completed check time and current check phase separately from the export time. Unverified, checking, stale, and inconsistent snapshots remain reviewable without update authority. Schema 3 keeps a global source failure visible while separately allowing review of Homebrew targets that have current positive source evidence and pass the target checks. Other update routes retain the global readiness requirement.

Use `⌘I` for installed/target versions, sources, cask, Bundle ID, path, and review details. Homebrew candidates offer **Review Homebrew Update in Vesslo**, using the exact request flow below. Other supported candidates may offer **Update in Vesslo** or **Open in App Store** after shared data, source, and action checks. **Review Update Source in Vesslo** opens the app's detail context; it does not itself start a source check. Warnings provide review context and do not grant update eligibility.

### Bulk Homebrew Update

Select 1–16 eligible Homebrew apps, inspect the exact selection, and open its review in Vesslo. Search changes preserve the selection. A fresh read at submission rejects changed schema/capabilities, session, inventory/check revisions, identities, paths, casks, sources, or versions. Schema 3 additionally checks each selected readiness proof and its expiry. Unrelated target failures do not invalidate a valid selection. Vesslo asks for confirmation before updating.

The request uses the app's versioned Homebrew review route and then displays the exact request receipt. It never runs Homebrew, `mas`, or Terminal, and never falls back to `update-all`. Only executable `runBrew` targets are selectable; Homebrew manual installer candidates require review in Vesslo. Individual Homebrew rows use the same exact review flow.

### Browse by Tag

Browse installed apps grouped by their exact tags. Native push/back navigation preserves the parent view. Counts exclude deleted records and count duplicate tags on an app only once.

### Review Apps

Review exported Security, Update Sources, or Management findings. The category dropdown works independently of **All Apps / Update Candidates**, selected from the action menu or with `⌘⇧U`. Search app identity, notes, tags, or review reasons; `⌘I` toggles details, with active findings presented before general app metadata.

Review rows offer Vesslo navigation and applicable inspection/copy actions, with no update or app-launch action. A plain available-update marker alone is not a review finding. Deleted records are excluded; stale snapshots remain available for review.

### Deleted Apps

Search existing `isDeleted` records by app name, Bundle ID, developer, path, tag, or memo. Details show the recorded identity, version, and available review context. Actions only copy a Bundle ID or recorded path, or reload the export. They do not open the former app, reveal its path, restore it, or start an update.

Only deleted records present in the export are shown. Deletion time, deletion reason, restore capability, and general verification activity are not supplied by the export and are not inferred.

### Homebrew Requests

Read app-owned receipts from the fixed `raycast_receipts.json` file. Inspect accepted, running, verification pending, verified completion, rejected, failed, or cancelled results and each original target. Request schema 2 preserves and displays each target's readiness evidence ID. Earlier publisher sessions and expired terminal results are marked as history; retained V1 records stay read-only and cannot authorize a new target-readiness request. Missing or unreadable receipts never mean acceptance or completion, and this command cannot retry, delete, or execute requests.

## Data and Action Policy

- Current visibility follows `isVisibleInUpdates` and `currentTargetSkipped`; an older skipped version does not hide a different current target. Legacy filtering remains available for review.
- File metadata is checked before rereading and parsing an unchanged export. Reads and app-path checks are asynchronous; a failed read retains the previous snapshot with an explicit status and restricted actions.
- Missing, malformed, permission-denied, invalid/future-dated, and 24-hour-old exports are distinguished. A declared count that contradicts visibility, or a visible deleted/ignored/currently-skipped record, produces a contract mismatch. Missing counts or incomplete visibility remain reviewable but cannot authorize update handoff.
- Known action and eligibility values are typed explicitly. Unknown values are retained for diagnostic context and cannot select an executable route. Schemas 2 and 3 are supported with separate readiness rules; unknown explicit schemas are rejected. Unversioned snapshots are browse-only. Schema 3 cannot fall back to V1 authority when capabilities or target evidence are missing.
- Installed-app Open/Finder actions require a verified available `.app` directory. Lists use native file icons from those paths with a fallback icon; exported Base64 image payloads are not rendered.
- Exported warning text is length-bounded and protected against Markdown/control-character display changes. Dates use an explicit UTC format, and common source names and singular/plural labels are consistent.
- Update, app-open, and Finder actions reread current data and revalidate identity and permissions to act. Update handoff additionally checks the displayed source/action, cask, installed version, and target version. Exact Homebrew requests support distinct installations with the same Bundle ID when UUID/path/cask are unambiguous. Generic non-Homebrew navigation still requires a unique Bundle ID.

## Versioned App Integration

**Current source contract:** the extension now consumes app export schema 3, Homebrew request schema 2 through `vesslo://review-homebrew/v2?payload=…`, and receipt/envelope schema 2. The producer must advertise `homebrewReviewV2`, `homebrewTargetReadinessV1`, and `requestReceiptsV2`. See the [target-readiness implementation and validation report](docs/TARGET_READINESS_2026-09-12.md), [connected interfaces](docs/APP_INTERFACE_REQUIREMENTS.md), and the app's [authoritative contract](/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Docs/RaycastHomebrewReadinessV2.md).

Global `checkPhase` and `checkReason` retain their meaning: an unrelated Sparkle failure still appears as `failed/sourceFailure`. Homebrew review additionally requires a completed full cohort, with `completedInventoryRevision == inventoryRevision` and `completedCheckRevision == checkRevision > 0`, plus a current positive proof for every selected target. Each proof binds the six-part installation/version identity to the publisher session and check/inventory revisions. Its maximum lifetime is 15 minutes; unchanged-file polling also withdraws expired readiness. This proves successful managed Homebrew metadata evaluation in the current check, not a new network fetch or an installed update. Failed, unverified, changed, or expired selected targets block the entire request.

New request targets preserve the proof UUID as `readinessEvidenceId`, and receipts retain the full original request, target order, and evidence IDs. Opening a URL still proves neither acceptance nor completion. The schema 3 app rejects V1 requests for new execution; retained V1 receipts remain history. Older schema 2 producers retain the strict global-ready V1 path only when they advertise its capabilities. Neither a new producer nor a consumer that does not understand schema 3 may reinterpret it as schema 2 or bypass missing evidence.

**Local installation status, 2026-09-13:** `/Applications/Vesslo.app` now contains the verified launch-continuation fix, executable SHA-256 `bdaad0cb4b8c7df900b1290f8c35f60e3b05fcae47503042c875aba553f36caa`, version `2.0.1 (28)`, universal Developer ID Team `54V3JMN338`. Eleven whole-scope mirrors with 2,383 records were verified before replacement. The installed Raycast `vesslo` runtime matches all 16 files of the final 317-test, seven-command build. [Installed validation report](docs/INSTALLED_VALIDATION_2026-09-13.md).

**Operating checks completed with the earlier scan-promotion app `cee47b…42ba`:** that app published 48 positive Homebrew source proofs; 43 passed the extension's unique-cask policy. Five Microsoft Office targets share one cask and remain excluded. All seven commands rendered in real Raycast, the update count matched at 82, an empty candidate search showed `REVIEW ONLY`, and real proof expiry automatically withdrew review authority. A production Apparency request reached native Review, Return left it unexecuted, and Cancel appeared on the same Raycast request screen with the original target/proof preserved.

**Current recovery and execution status:** exact native recovery review, cancellation, Return without execution, explicit binding, and original marker preservation were verified on the preceding `1ebc` build. The subsequent app fix keeps post-approval reconciliation owned by the app when its UI closes. The new installed `bdaad` build started with the approved roots and `-enableAutoUpdate NO`, completed a fresh scan, and executed one real KeyCastr update: **0.10.5 → 0.11.1**. Request `42733EA6-B861-4389-B98C-19AD927FBAA8` reached authoritative `completed`, revision 5; physical bundle version/hash, Brew installed metadata, and the actual Raycast **Completed — Verified by Vesslo** view agree. Earlier rejected/cancelled requests remain history. [Three-way verification](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/launch-continuation-fix/real-update-verification.json). The new same-session approval lifecycle has XCTest coverage. A separate native root-binding harness was subsequently prepared in the app closeout at `670bdf3`, with 991/996 passing tests, five conditional skips and no failures; its actual UI run still awaits Mac unlock. This source/Test addition is not included in the previously installed `bdaad` artifact. That installed-app validation did not publish a release. The extension integration and compact UI were subsequently committed as `435cb7c` and `8f0388b`; [the compact UI report](docs/UI_COMPACT_2026-09-13.md) tracks current native validation.

The first scan-promotion app's automated results are from **2026-09-12**: 702 total, 699 passed, 3 existing skips, 0 failed. The extension's 317/317 plus TypeScript, lint, and seven-command build are also from that date. September 13 recovery builds separately passed 971/967/4/0 and then **986 total / 982 passed / 4 skipped / 0 failed**, including 15 new continuation regressions. These runs are not added together. Two bounded test-only actor fixtures emitted nonblocking Thread Performance Checker warnings; production does not use those holds. Historical evidence remains in the [target-readiness report](docs/TARGET_READINESS_2026-09-12.md).

The older schema 2 global blocker remains documented as historical context: Sparkle failures for Luminar Neo and Vesslo produced `failed/sourceFailure` and blocked all Homebrew review. The [app readiness handoff](docs/VESSLO_PRODUCTION_READINESS_HANDOFF.ko.md) led to the target-specific contract, which continues to show global failures while requiring positive evidence for each selected Homebrew target.

The earlier [2026-09-12 native connection validation](docs/NATIVE_CONNECTION_2026-09-12.md) connected the original Raycast bulk sender to the app's existing Test-only native Review harness. The private bridge delivered the original URL bytes unchanged for three exact synthetic targets. Return left the receipt unchanged; native Cancel changed the same mounted Raycast receipt view from revision 1 `accepted` to revision 2 `cancelled`, also visible in Homebrew Requests. The host recorded one delivery and zero executor calls. The temporary extension registration and TestHost were cleaned up, and both existing Vesslo registrations were preserved at that point. No additional app patch was needed for that isolated connection. Those synthetic results do not close the current installed-app readiness issue or establish production review/receipt, TCC-denial, real update/Installer, or restart behavior.

## Development and Validation

Use Node.js 22.22.2 or later and the committed lockfile:

```sh
npm ci --no-audit --no-fund
npm run typecheck
npm run lint:source
npm test
npm run build:check
```

TypeScript checks dependency declarations as well as source (`skipLibCheck: false`). The [validation workflow](.github/workflows/validate.yml) performs locked installation, strict type checking, source lint, regression tests, and a seven-command distribution build on macOS. It does not register the extension, launch Raycast, or publish to the Store. A written workflow is not evidence of a successful hosted run.

`npm run lint` additionally runs Raycast's Store metadata validation, which may require network access. Store screenshots, destination-repository reconciliation, hosted CI, and publication remain separate release steps; see [repository delivery](docs/REPOSITORY_DELIVERY.md).

The inert fixture harness builds synthetic commands and replaces app, Finder, URL, and clipboard effects. The separate native TestHost adapter preserves the real export/receipt readers and exact sender, substitutes availability for only the three synthetic app paths, and delivers requests through the bound private inbox. Preparation and verification do not register or launch Raycast. See [fixture validation and native adapter helpers](docs/UI_FIXTURE_VALIDATION.md) and the [native connection report](docs/NATIVE_CONNECTION_2026-09-12.md), which records 228 passing automated tests, full lint, and a seven-command build alongside the native observations.

The earlier local installation report adds build/archive/export, signature, installed-byte, and runtime checks for the schema 2 installation. Its extension **228/228** tests and app-task **188/188** Swift tests retain their original scope and provenance; they are not new schema 3 test runs or proof of a production Homebrew update. The [target-readiness report](docs/TARGET_READINESS_2026-09-12.md) preserves the first schema 3 installation and its earlier 316-test extension and 688-test app runs. The [September 13 installed report](docs/INSTALLED_VALIDATION_2026-09-13.md) separates the **317/317 extension**, **702 total / 699 passed / 3 skipped scan-promotion app**, and **971 total / 967 passed / 4 skipped recovery app**, and **986 total / 982 passed / 4 skipped continuation app** runs. These are separate runs and are not added together.

The [first implementation report](docs/CONSUMER_SAFETY.md), [earlier extension follow-up](docs/EXTENSION_FOLLOWUP.md), [ownership stop report](docs/OWNERSHIP_STOP_REPORT.md), [2026-09-10 completion report](docs/COMPLETION_2026-09-10.md), and [2026-09-11 native fixture report](docs/NATIVE_SCHEMA2_2026-09-11.md) are historical records. Their earlier test counts and unfinished scope do not describe the latest patch. The September 13 installation closed the launch-recovery gate and verified one real KeyCastr update with its authoritative receipt. The extension integration was committed as `435cb7c` after a fresh 317-test run, type checking, source lint, and a seven-command build. Compact list and receipt presentation followed in `8f0388b` with 329 passing tests; see [the UI report](docs/UI_COMPACT_2026-09-13.md). New root-binding UI lifecycle, actual TCC denial, and updated Installer regression evidence are tracked separately. Store publication remains a separate release step.

## License

MIT
