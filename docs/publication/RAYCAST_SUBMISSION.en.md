# Vesslo — Raycast Store Submission Draft

Prepared on September 13, 2026 against extension HEAD `50196ab60fd8a7c973ba2ab45f6b31c1a29d5824`.

This prepares an update to the existing [Vesslo Store extension](https://www.raycast.com/hjm79/vesslo). No submission, upload, pull request, or Store publication was performed. Copy-ready text is separated from the author's remaining checks below. Historical validation is attributed to its existing report; this documentation pass did not rerun it.

The current public listing describes the earlier four-command integration, including direct Homebrew, Terminal, and `mas` actions and their old shortcuts. The proposed listing must replace those descriptions with the current Vesslo-owned review and receipt workflow. The [Vesslo companion product page](https://vesslo.top/vesslo) advertises a 14-day trial and purchase option; do not describe the companion as free. A public companion release containing the latest integration remains to be established. Submission stays on hold until that compatible public build and its setup/access requirements are confirmed.

## Copy-ready Store text

### Short description

Search your Vesslo app library, review updates and findings, and follow Homebrew requests from Raycast.

Use this sentence for the manifest description if approved. The longer text below is suitable for the README or a description requested during review; it does not imply a separate long-description manifest field. [Raycast manifest](https://developers.raycast.com/information/manifest).

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

The extension requires a separately installed compatible Vesslo companion. It has no extension account, API key, or custom credential preference. A publicly obtainable companion build and reproducible setup instructions must be identified before submission; the local tested version string alone is not the compatibility guarantee.

### Screencast

Attach the approved current-UI recording or screenshots here when preparing the actual PR. Demonstrate Search Apps, View Updates, the selected Homebrew review flow, and a receipt's summary/technical-details/back navigation. A recorded Completed result must be labeled as an existing recorded result unless the recording includes the corresponding real update.

For new commands, Raycast's current PR template requests a screencast; screenshots are an alternative for straightforward changes. Keep the live template's checklist in the eventual PR and mark each item only after completing it. [Official PR template](https://github.com/raycast/extensions/blob/main/.github/pull_request_template.md).

### Setup and review path

1. Use macOS with Raycast and a compatible Vesslo companion installed. The [companion product page](https://vesslo.top/vesslo) offers a 14-day trial and purchase option; this draft does not establish which public download includes the required integration or which license access the reviewer will need.
2. Open Vesslo, allow its normal inventory/export work to complete, and run an update check in Vesslo when testing update eligibility. The export is `~/Library/Application Support/Vesslo/raycast_data.json`; the receipt file is `~/Library/Application Support/Vesslo/raycast_receipts.json`.
3. For the current Homebrew flow, verify export schema 3 and capabilities `homebrewReviewV2`, `homebrewTargetReadinessV1`, and `requestReceiptsV2`. It uses request/receipt schema 2. Older schema 2 integrations follow a separate, stricter compatibility path; unversioned data is browse-only. No minimum publicly released Vesslo version has been established by this preparation pass.
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
| [Installed validation](../INSTALLED_VALIDATION_2026-09-13.md) and current README | One real KeyCastr update from 0.10.5 to 0.11.1 with matching app receipt, physical bundle, and Homebrew metadata. | One concrete successful operation, not universal success across sources or apps. |
| [Latest preflight-denial addendum](../UI_COMPACT_2026-09-13.md#addendum-local-app-applied-observed-preflight-denial) | Standalone probe observed initial `-1743`; Vesslo Test recovery UI replay passed 1/1 with zero skips/failures. | `denialSequenceVerified=false`; does not prove the fresh three-step denial sequence, installed Vesslo/`mas` TCC chain, or App Management denial. |
| Local metadata inspection on September 13 | `assets/extension-icon.png` measures 512×512; existing six `metadata/vesslo-*.png` files each measure 2000×1250. | Dimensions alone do not approve their content or establish correspondence with the final compact UI. |

### Current screenshot boundary

The four selected compact-UI evidence captures are 750×475 JPEG images despite their original `.png` names. They can illustrate the local introduction with their format represented accurately; they are not conforming Store metadata. The six pre-existing metadata images have the required dimensions but have not been approved as current-UI screenshots for this submission.

Create 3–6 new current-UI Store captures at 2000×1250, 16:10, PNG. Use a consistent background/theme, exclude personal data, and keep the frame focused on the Raycast extension. Suggested coverage: Search Apps; View Updates; Bulk Homebrew Update selection; Review Apps; Deleted Apps or tags; Homebrew Requests. A Vesslo native confirmation screenshot is useful review evidence, but is not a Raycast-only Store screenshot. [Screenshot requirements](https://developers.raycast.com/basics/prepare-an-extension-for-store#screenshots).

For Raycast's capture tool, configure **Window Capture** in Advanced preferences, open the extension in development mode, open the command, use the configured hotkey, and select **Save to Metadata**. The documentation's `⌘⇧⌥M` is an example configured hotkey, not a guaranteed default. Put other README-linked media in top-level `media/`. [Capture procedure](https://developers.raycast.com/basics/prepare-an-extension-for-store#adding-screenshots).

### Submission checklist

- [ ] Identify the publicly obtainable Vesslo build that supplies the documented contract; confirm its setup, OS requirements, and any companion license/access requirement. Do not invent a minimum version or reviewer credentials.
- [ ] Update the existing [hjm79/vesslo listing](https://www.raycast.com/hjm79/vesslo), and recheck any open PR before creating a duplicate. The manifest currently says `name: vesslo`, `author: hjm79`, `license: MIT`, platforms `macOS`, categories `Applications` / `Productivity`. The live Store handle matches; confirm that the submitting account can maintain that contribution. [Manifest](https://developers.raycast.com/information/manifest).
- [ ] Recheck the latest supported Raycast API before submission. The current manifest declares `^1.104.22`; this document neither upgrades it nor asserts that it is latest. Keep npm's committed lockfile. [Store preparation](https://developers.raycast.com/basics/prepare-an-extension-for-store#metadata-and-configuration).
- [ ] Review the final icon in light/dark themes and replace obsolete Store screenshots. Keep only runtime assets in `assets/`, and verify all linked media and relative documentation links from the eventual destination checkout.
- [ ] Adapt the latest changelog entries to Raycast's `## [Title] - {PR_MERGE_DATE}` format. Current newest entries use `— Unreleased`; this preparation did not rewrite them. [Version history](https://developers.raycast.com/basics/prepare-an-extension-for-store#version-history).
- [ ] Prepare a public-facing README with the setup and seven commands above. Reconcile older status paragraphs and remove machine-local/private evidence links from the public-facing material; preserve detailed historical reports with clear scope where appropriate.
- [ ] Run the current candidate's documented checks and full Store lint, then exercise that distribution build in Raycast. Record exact outcomes rather than checking boxes from historical results. Confirm hosted CI separately when the authorized PR exists.
- [ ] Review the current [extension guidelines](https://manual.raycast.com/extensions-guidelines), including uniqueness, setup documentation, maintenance responsibility, and feedback handling. Finish the official PR's media and checklist before sending it.
- [ ] Obtain the author's separate authorization to create/update the external PR. After review and merge, verify the updated live Store listing and install path against the submitted candidate.

Candidate validation commands, for the future authorized validation pass, are shown below. The repository documents Node.js 22.22.2 or later. No commands in this block were run while drafting this file.

```sh
npm ci --no-audit --no-fund
npm run typecheck
npm run lint:source
npm test
npm run lint
npm run build
```

`npm run publish` is a submission action: Raycast authenticates with GitHub and opens or updates a PR in `raycast/extensions`. Acceptance and merge trigger Store publication. It can squash local commits; review the chosen submission path and current destination before executing it. This draft stops before that action. [Publish an extension](https://developers.raycast.com/basics/publish-an-extension).
