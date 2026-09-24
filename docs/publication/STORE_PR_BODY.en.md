## Description

**Draft:** Before this update is ready for review, replace the Store metadata screenshots with current UI captures and complete the final user check required by the project's update guide. The installed-distribution inspection below is complete; the distribution-testing checklist item remains unchecked pending that user check.

Update the existing Vesslo extension with three additional commands: **Review Apps**, **Deleted Apps**, and **Homebrew Requests**. Existing commands gain multi-field search, source filtering, exact Homebrew selection, and compact status presentation.

Homebrew updates now go through Vesslo's native confirmation UI for 1–16 exact installations. The extension does not run Homebrew, `mas`, or Terminal directly. Request results come from Vesslo's receipts; opening a URL does not establish success. Prior published changelog entries and upstream contributions are preserved.

**Setup:** Requires Vesslo 2.1.0 (Build 30) or later on macOS 13 or later. [Download Vesslo 2.1.0](https://github.com/hjm79/Vesslo-MacAppManager-release/releases/download/v2.1.0/Vesslo.dmg), copy it to Applications, and complete onboarding with the 14-day trial or an existing license. Open Vesslo to export the app library, then run a Vesslo update check before testing Homebrew selection. A license is required after the trial. The extension needs no additional account or API key.

Validation: the full development checkout passed 329/329 tests with no skips. The public payload contains 20 portable suites covering 273 cases: 272 passed initially, and the one sandbox-blocked filesystem case passed in an isolated rerun with the required access. Strict TypeScript, source ESLint, full Raycast lint, and all seven distribution commands passed with API 2.4.1 / React 19. All seven commands were opened in the installed distribution; developer-name search, tag navigation, and request technical-details/back navigation were observed. This read-only smoke did not execute a new app update or replace the pending final user check.

## Screencast

These unedited screenshots show the current installed distribution. They are PR evidence images in `media/`, not 2000×1250 Store metadata. The current failed-check warning and historical receipt are preserved accurately. No new update was run for these captures.

### Search Apps

![Search Apps](https://raw.githubusercontent.com/hjm79/raycast-extensions/85e2f179d74cc58b3f50ce290d07d7cbd29bce5c/extensions/vesslo/media/vesslo-search-apps-20260924.jpg)

Developer-name search in the current read-only snapshot.

### View Updates

![View Updates](https://raw.githubusercontent.com/hjm79/raycast-extensions/85e2f179d74cc58b3f50ce290d07d7cbd29bce5c/extensions/vesslo/media/vesslo-view-updates-20260924.jpg)

The current export reports a failed full check; all 90 exported candidates remain reviewable.

### Bulk Homebrew Update

![Bulk Homebrew Update](https://raw.githubusercontent.com/hjm79/raycast-extensions/85e2f179d74cc58b3f50ce290d07d7cbd29bce5c/extensions/vesslo/media/vesslo-bulk-homebrew-update-20260924.jpg)

54 candidates, zero selected; this snapshot is review-only and does not demonstrate an executable handoff.

### Review Apps

![Review Apps](https://raw.githubusercontent.com/hjm79/raycast-extensions/85e2f179d74cc58b3f50ce290d07d7cbd29bce5c/extensions/vesslo/media/vesslo-review-apps-20260924.jpg)

A management finding and app identity details. No update runs from this review screen.

### Deleted Apps

![Deleted Apps](https://raw.githubusercontent.com/hjm79/raycast-extensions/85e2f179d74cc58b3f50ce290d07d7cbd29bce5c/extensions/vesslo/media/vesslo-deleted-apps-20260924.jpg)

Read-only Firefox history. The recorded path and version do not represent a currently installed app.

### Homebrew Requests

![Homebrew Requests](https://raw.githubusercontent.com/hjm79/raycast-extensions/85e2f179d74cc58b3f50ce290d07d7cbd29bce5c/extensions/vesslo/media/vesslo-homebrew-requests-20260924.jpg)

An expired historical receipt with a previously recorded Completed result; current installation is unconfirmed.

## Checklist

- [x] I read the [extension guidelines](https://developers.raycast.com/basics/prepare-an-extension-for-store)
- [x] I read the [documentation about publishing](https://developers.raycast.com/basics/publish-an-extension)
- [ ] I ran `npm run build` and [tested this distribution build in Raycast](https://developers.raycast.com/basics/prepare-an-extension-for-store#metadata-and-configuration)
- [x] I checked that files in the `assets` folder are used by the extension itself
- [x] I checked that assets used in the `README` are located outside the metadata folder if they were not generated with our [metadata tool](https://developers.raycast.com/basics/prepare-an-extension-for-store#how-to-use-it)
