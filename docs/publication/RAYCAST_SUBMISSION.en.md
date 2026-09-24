# Vesslo — Raycast Store Submission Draft

Updated on September 24, 2026. The submission checkout is based on merge `23859961f723bd5bcea1a219fba22c40fc82eb7c`, which brings the current Store contribution into the existing extension work. The September 13 documentation baseline remains in commit `eb68461`.

This prepares an update to the existing [Vesslo Store extension](https://www.raycast.com/hjm79/vesslo). The author has authorized the update submission and completed the official GitHub authentication. Upstream synchronization is complete; no update PR is open as of this preparation check. This does not establish Store acceptance or publication.

**Companion release confirmed:** [Vesslo 2.1.0 (Build 30)](https://github.com/hjm79/Vesslo-MacAppManager-release/releases/tag/v2.1.0) was publicly released on September 24, 2026. [Download the reviewer DMG](https://github.com/hjm79/Vesslo-MacAppManager-release/releases/download/v2.1.0/Vesslo.dmg). This release supplies export schema 3 and the Homebrew review/readiness/receipt contracts. The earlier companion-publication blocker is resolved; current Store media and final user distribution testing remain pending.

The public listing describes the earlier four-command integration, including direct Homebrew, Terminal, and `mas` actions and their old shortcuts. The proposed listing replaces those descriptions with Vesslo-owned review and receipts. The [companion product page](https://vesslo.top/vesslo) specifies macOS 13 or later, a 14-day trial, and a purchase option; the companion must not be described as free.

Published history is retained: the upstream contribution's five dated changelog entries remain intact. Add the update entry above that history; do not replace the file with local unreleased notes or remove previous contributors' changes. Keep the detailed validation reports as historical evidence. The public README now focuses on setup and current commands rather than reproducing internal audit logs.

Copy-ready text is separated from author-only status below. Historical app/runtime evidence remains attributed to its original report. The current API 2 candidate passed fresh automated validation on September 24; Store media, user distribution smoke, and submission remain separate gates.

## Copy-ready Store text

### Short description

Search your Vesslo app library, review updates and findings, and follow Homebrew requests from Raycast.

Use this sentence for the manifest description. The longer text below is suitable for the README or a description requested during review; it does not imply a separate long-description manifest field. [Raycast manifest](https://developers.raycast.com/information/manifest).

### Longer introduction

Bring your Vesslo app library into Raycast. Find apps by name, Bundle ID, developer, tag, or memo, inspect update candidates, and browse the findings that Vesslo has exported.

Seven commands cover everyday app lookup and review:

- **Search Apps** finds installed app records across multiple fields and explains matching results.
- **View Updates** groups the exported candidates by source, with search, filtering, sorting, and version details.
- **Bulk Homebrew Update** lets you select up to 16 eligible app installations and open their exact review in Vesslo. Vesslo asks for confirmation before updating.
- **Browse by Tag** opens the apps assigned to each tag.
- **Review Apps** brings together exported security, update-source, and management findings.
- **Deleted Apps** shows deleted records still included in Vesslo's export, with identity and path copying.
- **Homebrew Requests** shows Vesslo's recorded request status and results for each selected app.

Vesslo for macOS is required. The extension reads the local data that Vesslo exports; it does not run its own inventory scan or update check. Reload Vesslo Data rereads that export. Exact Homebrew review requires a compatible Vesslo export and current readiness evidence for every selected target. Other supported update actions open Vesslo or the App Store as indicated in their action title.

The extension never runs Homebrew, `mas`, or Terminal directly. A sent request is not a completed update: Homebrew results come from Vesslo's request receipts. Stale or unverified data remains clearly labeled and does not grant permission to update.

## Copy-ready reviewer notes

### Description

This updates the existing Vesslo extension with its current seven-command macOS integration: app-library search, tag browsing, exported update and review views, deleted-record inspection, and exact Homebrew review requests with app-owned result receipts. It also replaces the public listing's earlier direct Homebrew, Terminal, and `mas` action descriptions and shortcuts.

Vesslo supplies the inventory, eligibility, check state, and request results. The extension presents those records and hands supported actions to Vesslo or the App Store. It does not execute package-manager commands. The Homebrew flow revalidates the selected installations before opening Vesslo's confirmation UI, and its result view follows the original request rather than inferring success from a launched URL.

The extension requires a separately installed Vesslo 2.1.0 (Build 30) or later on macOS 13 or later. [Download the public companion](https://github.com/hjm79/Vesslo-MacAppManager-release/releases/download/v2.1.0/Vesslo.dmg). Vesslo provides a 14-day trial and requires a license afterward. The extension itself has no account, API key, or custom credential preference.

### Screencast

Attach the approved current-UI recording or screenshots here when preparing the actual PR. Demonstrate Search Apps, View Updates, the selected Homebrew review flow, and a receipt's summary/technical-details/back navigation. A recorded Completed result must be labeled as an existing recorded result unless the recording includes the corresponding real update.

For new commands, Raycast's current PR template requests a screencast; screenshots are an alternative for straightforward changes. Keep the live template's checklist in the eventual PR and mark each item only after completing it. [Official PR template](https://github.com/raycast/extensions/blob/main/.github/pull_request_template.md).

### Setup and review path

1. Use macOS 13 or later with Raycast and [Vesslo 2.1.0 (Build 30) or later](https://github.com/hjm79/Vesslo-MacAppManager-release/releases/download/v2.1.0/Vesslo.dmg) installed. Open the DMG, copy Vesslo to Applications, and complete normal onboarding using the 14-day trial or an existing license. The [companion product page](https://vesslo.top/vesslo) provides purchase information.
2. Open Vesslo, allow its normal inventory/export work to complete, and run an update check in Vesslo when testing update eligibility. The export is `~/Library/Application Support/Vesslo/raycast_data.json`; the receipt file is `~/Library/Application Support/Vesslo/raycast_receipts.json`.
3. For the current Homebrew flow, verify export schema 3 and capabilities `homebrewReviewV2`, `homebrewTargetReadinessV1`, and `requestReceiptsV2`. It uses request/receipt schema 2. Older schema 2 integrations follow a separate, stricter compatibility path; unversioned data is browse-only. The first verified public companion supplying these contracts is Vesslo 2.1.0 (Build 30).
4. Open a command and use **Reload Vesslo Data** (`⌘R`). This rereads files and does not initiate a fresh Vesslo scan or update check. Missing data should lead the reviewer back to Vesslo setup; an absent receipt is not an accepted request.
5. Follow the command checks below using the reviewer's own app library or the documented isolated fixture harness. Synthetic fixtures demonstrate UI and policy behavior; they do not demonstrate a real update. Do not replace a user's operating export with a sample file.

| Command | Reviewer action | Expected behavior |
| --- | --- | --- |
| Search Apps | Search an existing name, then switch to another available field; open an exact tag and go back. | Match explanations agree with the query; back navigation preserves the original search. Installed-app actions depend on a currently available `.app` path. |
| View Updates | Change the source filter, search, and open details with `⌘I`. | Exported candidates, versions, source and check status remain visible; warnings do not grant update eligibility. Reload does not start an update check. |
| Bulk Homebrew Update | If current eligible targets exist, select one, change the search, inspect the exact selection, and open review in Vesslo. Cancel in Vesslo. | Selection survives search changes. Vesslo receives that exact request; cancellation appears on its receipt. No update runs without native approval. An empty eligible list or expired proof remains review-only. |
| Browse by Tag | Open an existing tag and return. | The list contains its installed app records; deleted records are excluded and navigation returns to the tag list. |
| Review Apps | Switch Security, Update Sources, and Management; independently switch All Apps / Update Candidates and open details. | Findings and identity context follow both filters. Rows offer review/inspection actions without update or app-launch actions. |
| Deleted Apps | Search a recorded deleted app and inspect its actions. | Only exported deleted records appear. Copy/reload actions are available; restore, update, app-open and Finder actions are absent. An empty export history is a valid empty state. |
| Homebrew Requests | Open the cancelled request or an existing record; inspect technical details and go back. | Original targets and recorded status remain bound to the request. Cached, expired, and earlier-session results remain identifiable. The command cannot retry, delete, or execute requests. |

Allow Homebrew readiness to expire without starting another check, then inspect the relevant command: expired evidence must stop authorizing a new review. Missing/malformed/permission-denied exports and changed-target cases can be checked using the isolated [fixture workflow](../UI_FIXTURE_VALIDATION.md), without changing operating permissions or installed apps. Any real update test is a separate, explicitly approved operation with a suitable target.

### Data, network, and permission boundaries

- The extension reads Vesslo's two fixed local JSON files and checks exported app paths. Names, versions, Bundle IDs, paths, tags, memos, findings, and request details may appear in Raycast. Treat those fields as personal data when preparing public media or diagnostic attachments.
- The inspected extension source has no HTTP client, remote telemetry, analytics, or direct shell/package-manager execution. User-selected actions can open an installed app, reveal it in Finder, open `vesslo://` or `macappstore://` URLs, and copy displayed values. Vesslo, the App Store, opened apps, and Raycast have their own network behavior; this is not a whole-system offline claim.
- Vesslo owns update execution, confirmation, system permission requests, and post-update verification. The extension does not grant Automation or App Management permission. It handles unreadable exports/receipts and unavailable paths with explicit status and restricted actions; it does not change permissions to recover access.
- The schema 3 Homebrew request binds app identity, canonical path, cask, installed/target versions, publisher session, revisions, and each target's evidence ID. A current completed check cohort and an unexpired positive proof are required. Receipts remain authoritative for request progress; launching Vesslo establishes neither acceptance nor completion.

## Author-only evidence and remaining work

### Existing evidence, not a new run

| Evidence | Recorded scope | Limit |
| --- | --- | --- |
| [Compact UI validation](../UI_COMPACT_2026-09-13.md) | 329/329 extension tests, strict TypeScript, source lint, seven-command distribution build; installed Raycast compact views and navigation. | Recorded previous runs and observations; no fresh test/build run in this documentation pass. |
| [Installed validation](../INSTALLED_VALIDATION_2026-09-13.md) and [compact UI validation](../UI_COMPACT_2026-09-13.md) | One real KeyCastr update from 0.10.5 to 0.11.1 with matching app receipt, physical bundle, and Homebrew metadata. | One concrete successful operation, not universal success across sources or apps. |
| [Latest preflight-denial addendum](../UI_COMPACT_2026-09-13.md#addendum-local-app-applied-observed-preflight-denial) | Standalone probe observed initial `-1743`; Vesslo Test recovery UI replay passed 1/1 with zero skips/failures. | `denialSequenceVerified=false`; does not prove the fresh three-step denial sequence, installed Vesslo/`mas` TCC chain, or App Management denial. |
| Local metadata inspection on September 13 | `assets/extension-icon.png` measures 512×512; existing six `metadata/vesslo-*.png` files each measure 2000×1250. | Dimensions alone do not approve their content or establish correspondence with the final compact UI. |

### September 24 preparation status

- Official GitHub authentication and Store contribution synchronization are complete. Merge `2385996` retains the existing extension commits and upstream contribution; the five previously published changelog entries remain unchanged.
- The existing `hjm79/vesslo` contribution is the update destination. The duplicate-PR check returned no open PR immediately before the official tool created [Draft PR #31475](https://github.com/raycast/extensions/pull/31475). Its submitted head is `85e2f179d74cc58b3f50ce290d07d7cbd29bce5c`, from public payload commit `b28d033`. It has not been marked ready for review.
- The public README has been rewritten around setup, seven commands, request results, and local data. Machine-specific audit paths and contradictory historical completion paragraphs have been removed from that public entry point. Detailed reports remain in `docs/` and in Git history.
- The companion-publication blocker is resolved. Live GitHub release metadata and the tagged release source confirm Vesslo 2.1.0 (Build 30), published at `2026-09-24T06:14:02Z`, from source `e159ba0bf32fbe69ab24d2fa4c1e2cc4f7d4ca35`. The public DMG is 21,306,907 bytes with SHA-256 `367870a951257861ee58eba2acfe7d8fc8c50bfe8ab39a81b91b0d6fdf864c0d`. The app owner's release record already covers signing/notarization, public re-download and installed-app update; these were not repeated by the extension task. Earlier unreleased notes are historical.
- API/dependency commit `7b47011` updates `@raycast/api` to `^2.4.1`, React to `19.0.0`, React types to `19.0.10`, and Node types to `22.19.17`. The Store contribution's `brace-expansion: 5.0.9` override is retained. No functional source edit was required.
- Fresh candidate validation passed: 329/329 tests, zero failures/skips; strict TypeScript; source ESLint; full Raycast lint (manifest, icons, metadata, ESLint, Prettier); and the seven-command distribution build. Logs are `/tmp/VessloRaycastStore-{typecheck,source-lint,tests,store-lint,build}-20260924.log` on the author's machine. These paths are author-only evidence, not reviewer setup.
- `npm run build` applied the new distribution locally. All seven generated JavaScript command files match the installed runtime byte-for-byte. The entire prior 16-file extension runtime was copied and hash-verified before replacement. Source map output-path differences are not executable-code differences. This installation check does not substitute for user testing of the final distribution.
- The new descriptive changelog entry uses `{PR_MERGE_DATE}`. All five upstream dated entries remain byte-for-byte identical. The complete former local development changelog is preserved in [the development archive](DEVELOPMENT_CHANGELOG_2026-09-13.md), as well as the untouched original development repository.
- Current installed-distribution inspection is complete for all seven commands, with developer-name search, tag navigation, and receipt technical-details/back navigation observed. Six unedited 750×475 JPEG screenshots now support the PR body. They preserve the failed-check/read-only and expired-history states; no real update was performed. These are PR evidence, not Store metadata. Current Store captures and the guide's final user check remain pending. Draft PR #31475 discloses these items; draft creation is not completion of the review-readiness gate.

- Remote payload verification covered all 134 changed files across both API pages: every change is inside `extensions/vesslo/`. All 143 final remote files match the local public payload Git blobs. Excluded internal documents, harnesses, local outputs, and known private evidence identifiers were absent. GitHub extension, NPM, and changelog checks passed; additional automated reviews were still running at this checkpoint.

### Current screenshot boundary

The four September 13 compact-UI evidence captures are 750×475 JPEG images despite their original `.png` names. Six new September 24 captures in `media/vesslo-{command}-20260924.jpg` also preserve unedited 750×475 JPEGs and now document the installed distribution for the PR. They can illustrate the local introduction with their format represented accurately; they are not conforming Store metadata. The six pre-existing metadata images have the required dimensions but have not been approved as current-UI screenshots for this submission.

Create 3–6 new current-UI Store captures at 2000×1250, 16:10, PNG. Use a consistent background/theme, exclude personal data, and keep the frame focused on the Raycast extension. Suggested coverage: Search Apps; View Updates; Bulk Homebrew Update selection; Review Apps; Deleted Apps or tags; Homebrew Requests. A Vesslo native confirmation screenshot is useful review evidence, but is not a Raycast-only Store screenshot. [Screenshot requirements](https://developers.raycast.com/basics/prepare-an-extension-for-store#screenshots).

In the installed Raycast 2.4.1 UI, **Capture Window** is under **Settings → Raycast → Commands**, rather than the Advanced location shown in older documentation. It initially had no hotkey. Automated input did not reliably record or delete the temporary binding; do not claim that current native Store captures were produced. User cleanup and capture remain pending. Open the extension command, use a correctly configured capture hotkey, and save the current UI using Raycast's metadata capture workflow. The documented `⌘⇧⌥M` is an example configured hotkey, not a guaranteed default. README-linked media belongs in top-level `media/`. [Capture procedure](https://developers.raycast.com/basics/prepare-an-extension-for-store#adding-screenshots).

### Submission checklist

- [x] Confirm the author's authorization to create/update the external Store PR. The current request supplies it; no additional generic submission permission is required.
- [x] Complete official GitHub authentication and pull the existing Store contribution before preparing the update. Preserve its five dated changelog entries and the existing implementation history.
- [x] Prepare a public-facing README with setup and seven commands. Document the released companion requirement and retain historical reports separately.
- [x] Identify the publicly obtainable compatible companion: Vesslo 2.1.0 (Build 30), macOS 13+, 14-day trial or an existing license. The setup above links directly to its public DMG; no reviewer credentials are required by the extension.
- [x] Recheck open PRs immediately before creating or updating the existing [hjm79/vesslo listing](https://www.raycast.com/hjm79/vesslo). The manifest identifies `name: vesslo`, `author: hjm79`, `license: MIT`, macOS, and Applications / Productivity. Do not submit a new duplicate extension. [Manifest](https://developers.raycast.com/information/manifest).
- [x] Complete the current API/dependency review: API `^2.4.1`, React `19.0.0`, aligned types and committed npm lockfile in `7b47011`. Preserve the upstream security override. [Store preparation](https://developers.raycast.com/basics/prepare-an-extension-for-store#metadata-and-configuration).
- [ ] Review the final icon in light/dark themes and replace obsolete Store screenshots. Verify linked media and relative documentation links from the final destination checkout.
- [x] Add the new changelog entry using `## [Title] - {PR_MERGE_DATE}` and verify byte-for-byte that all five existing dated entries are unchanged. Preserve prior contributors' changes. [Version history](https://developers.raycast.com/basics/prepare-an-extension-for-store#version-history).
- [x] Run the current candidate's automated checks and full Store lint: 329 tests, TypeScript, lint and seven-command distribution build passed.
- [ ] Complete user testing of the final distribution in Raycast and capture current UI. Local installation/code equality is verified; the project update guide requires user testing before publish. Hosted CI is a separate check once a PR exists.
- [x] Review the current [extension guidelines](https://manual.raycast.com/extensions-guidelines) and official PR template on September 24: update the existing extension, document usable setup, and retain the live checklist.
- [x] Post six current command screenshots, including all three added commands, in the [PR body](STORE_PR_BODY.en.md). All six URLs use the actual submitted commit; the public GitHub page loaded all six at their original 750×475 size. Store metadata replacement remains separate.
- [x] Create the authorized [Draft PR #31475](https://github.com/raycast/extensions/pull/31475), attach the accurate description and screenshots, and disclose the remaining readiness items.
- [ ] Mark the PR ready for review after current Store media and the final user check are complete. Draft creation does not claim these checks passed. After acceptance and merge, verify the live Store listing and install path against the submitted candidate.

Candidate validation commands are below. The repository documents Node.js 22.22.2 or later. The September 24 candidate results above are the current automated run. Do not rerun the entire suite for documentation-only changes; recheck relevant validation after code, dependencies, or payload contents change.

```sh
npm ci --no-audit --no-fund
npm run typecheck
npm run lint:source
npm test
npm run lint
npm run build
```

`npm run publish` is a submission action: Raycast authenticates with GitHub and opens or updates a PR in `raycast/extensions`. Acceptance and merge trigger Store publication. The publish tool can squash the contribution it sends to GitHub; preserve the development checkout and its commits, and use the isolated submission checkout. Confirm the final diff contains the retained published changelog and no unrelated changes before invoking it. Authentication and synchronization alone are not submission. [Publish an extension](https://developers.raycast.com/basics/publish-an-extension).


### Publishing payload

Do not run `publish` from the full author checkout. API 2.4.1 recursively copies the current directory into its submission cache; `.agent/`, `dist/`, and `docs/` are not in its hard-coded copy exclusions. Git ignores normally prevent untracked local evidence from being staged, but tracked internal documents and harness files would still enter the public PR. Use the separately prepared allowlisted payload; preserve all author history and evidence in this checkout. Inspect its file manifest and resulting PR diff before submission. The public companion setup is documented. The official publish tool created Draft PR #31475 from the allowlisted checkout; current Store screenshots and the final user check remain required before marking it ready for review. Only the draft-creation step proceeded ahead of these checks, with both pending items disclosed in the PR.
