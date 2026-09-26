## Description

Update the existing Vesslo extension with three additional commands: **Review Apps**, **Deleted Apps**, and **Homebrew Requests**. Existing commands gain multi-field search, source filtering, exact Homebrew selection, and compact status presentation.

Homebrew updates now go through Vesslo's native confirmation UI for 1–16 exact installations. The extension does not run Homebrew, `mas`, or Terminal directly. Request results come from Vesslo's receipts; opening a URL does not establish success. Prior published changelog entries and upstream contributions are preserved.

**Setup:** Requires Vesslo 2.1.0 (Build 30) or later on macOS 13 or later. [Download Vesslo 2.1.0](https://github.com/hjm79/Vesslo-MacAppManager-release/releases/download/v2.1.0/Vesslo.dmg), copy it to Applications, and complete onboarding with the 14-day trial or an existing license. Open Vesslo to export the app library, then run a Vesslo update check before testing Homebrew selection. A license is required after the trial. The extension needs no additional account or API key.

Validation:

- All 273 tests shipped in this PR passed with Raycast API 2.5.1. Strict TypeScript, source ESLint, Raycast lint, and the seven-command distribution build also passed.
- All seven commands were opened in the installed distribution. Field search, tag navigation, and request technical-details/back navigation were checked. No app update was executed during this smoke check.

## Screencast

The author captured these six 2000×1250 PNG screenshots on September 26, 2026. They show the three new commands alongside search, updates, and Homebrew candidates. The screenshots retain the actual failed-check and expired-history states.

### Search Apps

![Search Apps](https://raw.githubusercontent.com/hjm79/raycast-extensions/7b68bd64ce8a990566c1d90f3f9b57f6be47f047/extensions/vesslo/metadata/search_apps.png)

Search for Microsoft in a review-only snapshot; the visible check-status warning still applies.

### View Updates

![View Updates](https://raw.githubusercontent.com/hjm79/raycast-extensions/7b68bd64ce8a990566c1d90f3f9b57f6be47f047/extensions/vesslo/metadata/view_updates.png)

Current and available versions for 90 exported update candidates, grouped by source.

### Bulk Homebrew Update

![Bulk Homebrew Update](https://raw.githubusercontent.com/hjm79/raycast-extensions/7b68bd64ce8a990566c1d90f3f9b57f6be47f047/extensions/vesslo/metadata/bulk_homebrew_update.png)

Homebrew candidates before selection. This snapshot is review-only because its full update check failed.

### Review Apps

![Review Apps](https://raw.githubusercontent.com/hjm79/raycast-extensions/7b68bd64ce8a990566c1d90f3f9b57f6be47f047/extensions/vesslo/metadata/review_apps.png)

The management review for calibre, with its finding, versions, source, and app identity.

### Deleted Apps

![Deleted Apps](https://raw.githubusercontent.com/hjm79/raycast-extensions/7b68bd64ce8a990566c1d90f3f9b57f6be47f047/extensions/vesslo/metadata/deleted_apps.png)

Read-only Butterfly Collection history. The recorded path and version do not establish a currently installed app.

### Homebrew Requests

![Homebrew Requests](https://raw.githubusercontent.com/hjm79/raycast-extensions/7b68bd64ce8a990566c1d90f3f9b57f6be47f047/extensions/vesslo/metadata/homebrew_requests.png)

An expired historical receipt with a previously recorded Completed result; current installation is unconfirmed.

## Checklist

- [x] I read the [extension guidelines](https://developers.raycast.com/basics/prepare-an-extension-for-store)
- [x] I read the [documentation about publishing](https://developers.raycast.com/basics/publish-an-extension)
- [x] I ran `npm run build` and [tested this distribution build in Raycast](https://developers.raycast.com/basics/prepare-an-extension-for-store#metadata-and-configuration)
- [x] I checked that files in the `assets` folder are used by the extension itself
- [x] I checked that assets used in the `README` are located outside the metadata folder if they were not generated with our [metadata tool](https://developers.raycast.com/basics/prepare-an-extension-for-store#how-to-use-it)
