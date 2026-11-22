# Repository delivery and validation

## Moved to the original checkout on 2026-11-22

All Raycast branches and the uncommitted October 2 work now live in the
original nested repository, `Vesslo/vesslo-raycast`. The independent
`raycast-*-work` clones described below are no longer where work happens.
See [HANDOFF_2026-11-22.ko.md](HANDOFF_2026-11-22.ko.md).

## Ownership observed on 2026-09-10

The implementation in this task lives only in the independent
`raycast-extension-work` clone, based on
`af13e51fb64eaaa181af89395000bbd6a9b88f2e`.

The original Vesslo checkout and its nested extension are separate Git
repositories:

- App root: `/Users/hjm/Documents/git/all_application/Vesslo`, observed HEAD
  `14b3916a3fcf00eedce2ffbf71844e0716cfa27b`.
- Nested extension: `vesslo-raycast`, observed HEAD
  `af13e51fb64eaaa181af89395000bbd6a9b88f2e`, branch
  `codex/raycast-eligibility-actions`, origin
  `https://github.com/hjm79/Vesslo-raycast_extension.git`.
- The app root also tracks ordinary files under `vesslo-raycast/`. For example,
  `git ls-files --stage vesslo-raycast/package.json` reports mode `100644`,
  not a submodule entry. Its recorded blob differs from the nested repository's
  `package.json` blob. There is no `.gitmodules` file or registered submodule.
- The nested worktree was clean when inspected. Its locally cached upstream
  comparison was `0 0`; no fetch was performed, so this is not a live remote
  synchronization guarantee.

The two indexes can therefore record different versions of the same nested
files. Copying extension changes into that directory and staging the app root
would silently give two repositories ownership of one release. This task has
not changed either original repository or either index.

## Minimal delivery plan

1. Use the standalone extension repository as the source of truth for extension
   source, tests, tooling, and release metadata. The app repository owns Swift
   implementation and the producer side of the export/handoff contract.
2. Review the complete diff against the extension baseline, including new files.
   Keep extension safety logic and presentation changes in separate issue
   commits when delivery is authorized. Do not include generated `dist/`,
   fixture registrations, `.agent/`, or local validation output accidentally.
3. Deliver those commits to a dedicated branch in the standalone extension
   repository and run the workflow there. The workflow in this clone assumes
   `package.json` is at the repository root. A workflow nested under the app
   repository's `vesslo-raycast/.github/` is not an app-root workflow.
4. Reconcile the app root's duplicate tracked copy in a separate repository
   maintenance change owned by the app task. Prefer one explicit relationship:
   a pinned submodule or an intentionally maintained vendored snapshot. The
   current task does not remove tracked files, rewrite history, or create that
   relationship.
5. Recheck the destination branch and current Raycast Store contribution before
   preparing a release. Historical ahead counts and historical PR state are not
   release evidence. No commit, push, pull request, or publication is performed
   by the validation workflow.

## Tooling changes

`skipLibCheck` is disabled so dependency declarations are checked as well as
source. The previous Node 20.10.0 declarations were incompatible with the
installed TypeScript 5.9 typed-array definitions. React 18.2.27 declarations
referenced the missing `scheduler/tracing` module. The repair stays within the
existing type majors: `@types/node` 20.19.43 and `@types/react` 18.3.31, with the
React override matching the direct dependency. Runtime React, Raycast API,
TypeScript, and ESLint versions are unchanged by this repair. The lockfile
records the required `undici-types` update and removal of the obsolete scheduler
type dependency.

The workflow uses macOS 15 and Node 22.22.2. The locked Raycast API package requires
Node `>=22.22.2`; use at least that patch locally. It runs `npm ci`, source and
dependency type checking, source lint, contract/regression tests, and a
non-interactive distribution build. It does not launch Raycast, register fixture
extensions, or execute Vesslo updates. The build flags are documented in the
[Raycast CLI reference](https://developers.raycast.com/information/developer-tools/cli).

GitHub Actions are pinned to verified upstream commits. The workflow has only
`contents: read`, does not persist checkout credentials, and runs ordinary pull
request events. See the official [checkout](https://github.com/actions/checkout)
and [setup-node](https://github.com/actions/setup-node) documentation.

## Separate release evidence

Local verification on 2026-09-10 used a real independent clone of the extension
Git repository with the current source overlaid, fresh `npm ci`, and Node
22.22.2. After the final native UI fixes, dependency/source type checking, source
lint, all 138 tests, and the
six-command distribution build passed. The lockfile remained unchanged. A local
manifest records SHA-256 hashes for 57 source, tooling, test, and asset files;
all hashes still matched the working source immediately after verification.
The local evidence files are `.agent/tooling-final-manifest.json` and
`.agent/tooling-final-validation.log`; they are not release inputs.

A local successful build and a written workflow do not prove that hosted CI has
run. Hosted CI has not run until this patch is delivered to the chosen
repository and the run succeeds.

Source lint is intentionally separate from `ray lint`: the full Raycast lint
also validates Store metadata and may depend on network access. Store screenshots
must show the final behavior, match the six command descriptions, and exclude
private live app data. Native fixture screenshots are useful UI evidence but
must not imply a real update or real app-side integration was completed.

Release review must distinguish extension tests, synthetic native UI checks,
producer/consumer contract checks, real Vesslo handoff, verified update results,
Store metadata validation, and publication. App-dependent features remain
unavailable until their documented contracts exist; a review-only bulk command
does not satisfy selected-target batch execution.
