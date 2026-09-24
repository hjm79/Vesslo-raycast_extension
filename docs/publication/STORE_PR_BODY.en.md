## Description

Update the existing Vesslo extension with three additional commands: **Review Apps**, **Deleted Apps**, and **Homebrew Requests**. Existing commands gain multi-field search, source filtering, exact Homebrew selection, and compact status presentation.

Homebrew updates now go through Vesslo's native confirmation UI for 1–16 exact installations. The extension does not run Homebrew, `mas`, or Terminal directly. Request results come from Vesslo's receipts; opening a URL does not establish success. Prior published changelog entries and upstream contributions are preserved.

**Setup:** Requires Vesslo 2.1.0 (Build 30) or later on macOS 13 or later. [Download Vesslo 2.1.0](https://github.com/hjm79/Vesslo-MacAppManager-release/releases/download/v2.1.0/Vesslo.dmg), copy it to Applications, and complete onboarding with the 14-day trial or an existing license. Open Vesslo to export the app library, then run a Vesslo update check before testing Homebrew selection. A license is required after the trial. The extension needs no additional account or API key.

Validation: 329/329 tests passed with no skips, strict TypeScript, source ESLint, full Raycast lint, and all seven distribution commands built using API 2.4.1 / React 19. Local distribution installation is verified. Final user smoke testing and current media are pending.

## Screencast

Pending current-UI recording of Search Apps, View Updates, exact Homebrew selection and cancellation, the three added commands, and receipt detail/back navigation. Do not substitute the older Store screenshots. Any existing Completed receipt shown in the recording must be identified as a historical result.

## Checklist

- [x] I read the [extension guidelines](https://developers.raycast.com/basics/prepare-an-extension-for-store)
- [x] I read the [documentation about publishing](https://developers.raycast.com/basics/publish-an-extension)
- [ ] I ran `npm run build` and [tested this distribution build in Raycast](https://developers.raycast.com/basics/prepare-an-extension-for-store#metadata-and-configuration)
- [x] I checked that files in the `assets` folder are used by the extension itself
- [x] I checked that assets used in the `README` are located outside the metadata folder if they were not generated with our [metadata tool](https://developers.raycast.com/basics/prepare-an-extension-for-store#how-to-use-it)
