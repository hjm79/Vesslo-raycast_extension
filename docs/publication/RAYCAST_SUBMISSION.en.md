# Vesslo — Raycast Store Submission Draft

Updated on September 26, 2026. The submission checkout is based on merge `23859961f723bd5bcea1a219fba22c40fc82eb7c`, which brings the current Store contribution into the existing extension work. The September 13 documentation baseline remains in commit `eb68461`.

This prepares an update to the existing [Vesslo Store extension](https://www.raycast.com/hjm79/vesslo). The author has authorized the update submission and completed the official GitHub authentication. Upstream synchronization and submission are complete; [PR #31475](https://github.com/raycast/extensions/pull/31475) remains a Draft awaiting final user acceptance. The September 26 screenshot replacement is being prepared for that existing PR. This does not establish Store acceptance or publication.

**Companion release confirmed:** [Vesslo 2.1.0 (Build 30)](https://github.com/hjm79/Vesslo-MacAppManager-release/releases/tag/v2.1.0) was publicly released on September 24, 2026. [Download the reviewer DMG](https://github.com/hjm79/Vesslo-MacAppManager-release/releases/download/v2.1.0/Vesslo.dmg). This release supplies export schema 3 and the Homebrew review/readiness/receipt contracts. The earlier companion-publication blocker is resolved. The author has supplied current Store PNG captures for the September 26 replacement; posting and checking those images and final user acceptance remain separate steps.

The public listing describes the earlier four-command integration, including direct Homebrew, Terminal, and `mas` actions and their old shortcuts. The proposed listing replaces those descriptions with Vesslo-owned review and receipts. The [companion product page](https://vesslo.top/vesslo) specifies macOS 13 or later, a 14-day trial, and a purchase option; the companion must not be described as free.

Published history is retained: the upstream contribution's five dated changelog entries remain intact. Add the update entry above that history; do not replace the file with local unreleased notes or remove previous contributors' changes. Keep the detailed validation reports as historical evidence. The public README now focuses on setup and current commands rather than reproducing internal audit logs.

Copy-ready text is separated from author-only status below. Historical app/runtime evidence remains attributed to its original report. The API 2.5.1 candidate passed automated validation on September 25, and the seven-command installed-runtime smoke remains valid. The September 26 work replaces screenshots; it does not rerun those checks or satisfy final user acceptance.

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

### September 26 screenshot replacement

- The author supplied six new 2000×1250 PNG captures and explicitly requested replacement of the previous screenshots. This supersedes the September 25 instruction to retain the old images; the earlier entries below remain historical records.
- The replacement set is `metadata/search_apps.png`, `view_updates.png`, `bulk_homebrew_update.png`, `review_apps.png`, `deleted_apps.png`, and `homebrew_requests.png`. All six inputs are genuine PNGs with the required dimensions and distinct SHA-256 hashes. Image contents are preserved.
- The replacement removes the six prior `metadata/vesslo-*.png` files and the six September 24 `media/vesslo-*-20260924.jpg` files, and the old README `media/vesslo-search-apps.jpg` from the current submission payload. README now uses a byte-identical copy of the new Search Apps PNG in `media/`; the local introduction search image and date note are aligned. Git history retains the previous versions; other historical introduction media is unchanged.
- The prepared [PR body](STORE_PR_BODY.en.md) now points to the new metadata images and identifies Butterfly Collection in Deleted Apps. Captured failed-check, older-than-24-hours, and expired-receipt warnings remain accurately described. New screenshots are not evidence of a new successful check, update, or final user acceptance.
- The official publish tool updated existing PR #31475 to `7b68bd64ce8a990566c1d90f3f9b57f6be47f047` from payload commit `41ca842`. All six PR image URLs are pinned to that commit. GitHub metadata blob hashes match the supplied originals, and the live PR loaded all six images at 2000×1250. The remote change consists only of screenshot additions/removals and the README image path; functional source, dependencies, and CHANGELOG are unchanged. Raycast lint and the seven-command distribution build passed. No full test suite or native app update was repeated. PR remains Draft pending the separate final user acceptance check; updating this PR does not publish the Store listing.
- The initial official publish attempt encountered the documented fork synchronization OAuth 422 error. A read-only comparison established the fork main was 40 commits behind with no unique commits; GitHub Sync fork (merge-upstream API with existing CLI authentication) completed as a fast-forward. The subsequent official publish succeeded without requesting additional credentials or changing authentication scopes.

### September 25 review follow-up

- The official tool updated the existing [PR #31475](https://github.com/raycast/extensions/pull/31475) to `7c1ff3ec2f3ed61f69781edcde10f278fcb5c592` from public payload `cd575f4`. The remote comparison against the previous submission contains exactly three changed files: `package.json`, `package-lock.json`, and the new CHANGELOG sentence. The reviewed PR body is posted and matches the local copy; all six image URLs remain unchanged.
- The author asked to keep the existing images and check the remaining submission details. No image file or image URL changed. Screenshot replacement is outside this continuation, rather than an unfinished submission task.
- The linked Raycast bot comment is a review-queue acknowledgement. At the original submitted head `85e2f179d74cc58b3f50ce290d07d7cbd29bce5c`, every automated check passed, including Greptile and both Socket checks. No concrete inline change request was present; this is not human approval.
- The official registry now reports Raycast API 2.5.1. Only the API dependency and lockfile changed; React, type packages, the upstream security override, and functional source are unchanged. The fresh author run passed 329/329 tests; the public payload passed 273/273 tests, both without failures or skips. TypeScript, source lint, Raycast lint, and all seven distribution builds passed. Logs are `/tmp/VessloRaycastAPI251-20260925-*.log`.
- All seven rebuilt JavaScript command files exactly match the installed distribution previously inspected. The existing seven-command UI smoke remains applicable; no installation, image capture, or real app update was repeated.
- The new CHANGELOG entry now states that invalid export data blocks update actions; it no longer promises reviewable rows when data is absent or unsupported. All five already published entries remain byte-for-byte unchanged, and upstream's Vesslo entry has not changed since the prior synchronization.
- The public PR body is reduced to feature changes, setup, relevant validation, and existing screenshots. The official distribution-build/test checkbox records the completed build and installed-runtime smoke. The project's separate final user acceptance check is still awaiting an answer and keeps the PR in Draft.

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

### Current screenshot scope

The current replacement consists of the author's six unedited September 26 PNG captures, each 2000×1250 (16:10), for both Store metadata and the PR body. The six old Store images and six September 24 PR JPEGs are removed by this replacement. The four September 13 introduction captures remain historical illustration media; they are not the current Store metadata. [Screenshot requirements](https://developers.raycast.com/basics/prepare-an-extension-for-store#screenshots).

The September 25 decision to retain images is superseded by the author's September 26 replacement request. Final verification must cover only the new file set, dimensions, intended removals, public URLs, and their captions; completed source/runtime checks retain their original scope.

**Earlier capture-tool observation:** In the installed Raycast 2.4.1 UI, **Capture Window** is under **Settings → Raycast → Commands**, rather than the Advanced location shown in older documentation. It initially had no hotkey. Automated keyboard input did not reliably record the temporary binding. The temporary binding was removed with the visible clear control, and the UI returned to “Record Hotkey”; no user cleanup is pending. The built-in capture command displayed a preview, but no conforming current Store PNG was verified. Further capture work is outside the September 25 continuation. Open the extension command, use a correctly configured capture hotkey, and save the current UI using Raycast's metadata capture workflow. The documented `⌘⇧⌥M` is an example configured hotkey, not a guaranteed default. README-linked media belongs in top-level `media/`. [Capture procedure](https://developers.raycast.com/basics/prepare-an-extension-for-store#adding-screenshots).

### Submission checklist

- [x] Confirm the author's authorization to create/update the external Store PR. The current request supplies it; no additional generic submission permission is required.
- [x] Complete official GitHub authentication and pull the existing Store contribution before preparing the update. Preserve its five dated changelog entries and the existing implementation history.
- [x] Prepare a public-facing README with setup and seven commands. Document the released companion requirement and retain historical reports separately.
- [x] Identify the publicly obtainable compatible companion: Vesslo 2.1.0 (Build 30), macOS 13+, 14-day trial or an existing license. The setup above links directly to its public DMG; no reviewer credentials are required by the extension.
- [x] Recheck open PRs immediately before creating or updating the existing [hjm79/vesslo listing](https://www.raycast.com/hjm79/vesslo). The manifest identifies `name: vesslo`, `author: hjm79`, `license: MIT`, macOS, and Applications / Productivity. Do not submit a new duplicate extension. [Manifest](https://developers.raycast.com/information/manifest).
- [x] Complete the current API/dependency review: API `^2.5.1`, React `19.0.0`, aligned types and the npm lockfile. The earlier API 2.4.1 result is historical. Preserve the upstream security override. [Store preparation](https://developers.raycast.com/basics/prepare-an-extension-for-store#metadata-and-configuration).
- [x] Receive and inspect the author's six September 26 PNG captures: 2000×1250, six distinct files. Keep the existing icon. This replacement supersedes the earlier instruction to retain old screenshots.
- [x] Add the new changelog entry using `## [Title] - {PR_MERGE_DATE}` and verify byte-for-byte that all five existing dated entries are unchanged. Preserve prior contributors' changes. [Version history](https://developers.raycast.com/basics/prepare-an-extension-for-store#version-history).
- [x] Run the API 2.5.1 candidate's automated checks and full Store lint: 329 author tests, 273 public-payload tests, TypeScript, lint and seven-command distribution build passed.
- [ ] Receive the final user acceptance result in Raycast. Installed-code equality and the seven-command runtime smoke are verified. The official distribution-test checkbox records those completed checks; the project's separate user acceptance requirement remains open.
- [x] Review the current [extension guidelines](https://manual.raycast.com/extensions-guidelines) and official PR template on September 24: update the existing extension, document usable setup, and retain the live checklist.
- [ ] Post the six September 26 metadata images through the existing PR and [PR body](STORE_PR_BODY.en.md), remove the six prior Store images and six September 24 PR JPEGs from the payload, then pin the new image URLs to the actual submitted commit and verify loading. The earlier JPEG links were verified on September 24; that result does not verify the new URLs.
- [x] Create the authorized [Draft PR #31475](https://github.com/raycast/extensions/pull/31475), attach the accurate description and screenshots, and disclose the remaining readiness items.
- [ ] Mark the PR ready for review after the final user check is complete. Draft creation does not claim these checks passed. After acceptance and merge, verify the live Store listing and install path against the submitted candidate.

Candidate validation commands are below. The repository documents Node.js 22.22.2 or later. The September 25 API 2.5.1 results above are the current automated run. Do not rerun the entire suite for documentation-only changes; recheck relevant validation after code, dependencies, or payload contents change.

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

Do not run `publish` from the full author checkout. API 2.4.1 recursively copies the current directory into its submission cache; `.agent/`, `dist/`, and `docs/` are not in its hard-coded copy exclusions. Git ignores normally prevent untracked local evidence from being staged, but tracked internal documents and harness files would still enter the public PR. Use the separately prepared allowlisted payload; preserve all author history and evidence in this checkout. Inspect its file manifest and resulting PR diff before submission. The public companion setup is documented. The official publish tool created Draft PR #31475 from the allowlisted checkout; the final user check remains required before marking it ready for review. The author's September 26 instruction replaces the old Store images and September 24 PR JPEGs with six new PNG captures. The PR body identifies the remaining user acceptance check without reopening completed automated or runtime checks.
