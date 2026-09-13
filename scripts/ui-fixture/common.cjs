const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const ts = require("typescript");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "../..");
const BASELINE = "af13e51fb64eaaa181af89395000bbd6a9b88f2e";
function sourceRevision() {
  const revision = execFileSync("git", ["rev-parse", "--verify", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
  if (!/^[a-f0-9]{40,64}$/.test(revision))
    throw new Error("Invalid source revision.");
  return revision;
}
const SCENARIOS = [
  "ready-mixed",
  "review-actions",
  "stale-retained",
  "missing-empty",
  "malformed-retained",
  "permission-denied-retained",
  "path-unavailable",
  "tag-becomes-empty",
  "unchanged-polling-large",
  "count-mismatch",
  "count-unverifiable",
  "display-edge-cases",
  "schema2-checking",
  "schema3-ready",
  "schema3-source-failed-ready-targets",
  "schema3-target-failed",
  "schema3-proof-missing",
  "schema3-proof-expired",
  "schema3-cohort-incomplete",
  "receipts-pending",
  "receipts-completed",
  "receipts-partial-failure",
  "receipts-mixed-history",
];
const COMMANDS = [
  "search-apps",
  "updates",
  "bulk-homebrew-update",
  "browse-by-tag",
  "review-apps",
  "deleted-apps",
  "handoff-requests",
];
const SOURCES = [
  ...COMMANDS.map((name) => `${name}.tsx`),
  "types.ts",
  "constants.ts",
  "components/SharedAppListItem.tsx",
  "components/AppActions.tsx",
  "components/DataStateNotice.tsx",
  "components/HomebrewRequestReview.tsx",
  "components/HandoffRequestStatus.tsx",
  ...[
    "useVessloData",
    "data-state",
    "app-policy",
    "action-policy",
    "update-filter",
    "audit-warning",
    "audit-review",
    "brew",
    "review-filter",
    "search-filter",
    "display-format",
    "updates-filter",
    "deleted-records",
    "handoff-contract",
    "handoff-execution",
    "homebrew-readiness",
    "receipt-contract",
  ].map((name) => `utils/${name}.ts`),
];
const TEMPLATES = {
  "src/original/utils/data-reader.ts": "reader.ts",
  "src/original/utils/actions.ts": "actions.ts",
  "src/fixture/api.tsx": "api.tsx",
  "src/fixture/events.ts": "events.ts",
  "src/fixture/scenarios.ts": "scenarios.ts",
  "src/original/utils/useHandoffReceipts.ts": "receipts.ts",
};
const UI_EXPORTS = new Set([
  "Action",
  "ActionPanel",
  "Color",
  "Icon",
  "List",
  "Detail",
  "useNavigation",
]);
const UI_MEMBERS = new Set([
  "Detail",
  "Action",
  "Action.Push",
  "Action.CopyToClipboard",
  "ActionPanel",
  "ActionPanel.Section",
  "ActionPanel.Submenu",
  "List",
  "List.Item",
  "List.Item.Detail",
  "List.Section",
  "List.EmptyView",
  "List.Dropdown",
  "List.Dropdown.Item",
  "List.Dropdown.Section",
]);
const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
const posix = (value) => value.split(path.sep).join("/");

function transformSource(text, relative) {
  if (
    relative === "utils/handoff-contract.ts" ||
    relative === "utils/handoff-execution.ts"
  ) {
    const parsed = ts.createSourceFile(
      relative,
      text,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const excluded = new Set([
      "buildHomebrewReviewURL",
      "parseHomebrewReviewURL",
      "createHomebrewReviewExecutor",
    ]);
    text = parsed.statements
      .filter(
        (node) =>
          !(ts.isFunctionDeclaration(node) && excluded.has(node.name?.text)),
      )
      .map((node) => node.getText(parsed))
      .join("\n\n");
    text = text.replace(/\s*buildHomebrewReviewURL,/, "");
  }
  const file = ts.createSourceFile(
    relative,
    text,
    ts.ScriptTarget.Latest,
    true,
    relative.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  if (relative === "utils/brew.ts") {
    const names = new Set([
      "BREW_CASK_TOKEN_PATTERN",
      "normalizeBrewCaskToken",
      "isValidBrewCaskToken",
    ]);
    const kept = file.statements.filter((node) =>
      ts.isFunctionDeclaration(node)
        ? names.has(node.name?.text)
        : ts.isVariableStatement(node) &&
          node.declarationList.declarations.every((d) =>
            names.has(d.name.getText(file)),
          ),
    );
    if (kept.length !== 3)
      throw new Error(
        "Homebrew pure helper shape changed; review fixture extraction.",
      );
    return kept.map((node) => node.getText(file)).join("\n\n") + "\n";
  }
  const edits = [];
  for (const node of file.statements) {
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier.text === "@raycast/api"
    ) {
      const bindings = node.importClause?.namedBindings;
      if (!bindings || !ts.isNamedImports(bindings) || node.importClause.name)
        throw new Error(`Unsupported native API import in ${relative}`);
      for (const element of bindings.elements) {
        if (!UI_EXPORTS.has((element.propertyName ?? element.name).text))
          throw new Error(`External API import in ${relative}`);
      }
      let specifier = posix(
        path.relative(
          path.dirname(`src/original/${relative}`),
          "src/fixture/api",
        ),
      );
      if (!specifier.startsWith(".")) specifier = `./${specifier}`;
      edits.push({
        start: node.moduleSpecifier.getStart(file),
        end: node.moduleSpecifier.end,
        text: JSON.stringify(specifier),
      });
    }
  }
  for (const edit of edits.reverse())
    text = text.slice(0, edit.start) + edit.text + text.slice(edit.end);
  return text;
}

function assertSafeSource(text, relative) {
  const file = ts.createSourceFile(
    relative,
    text,
    ts.ScriptTarget.Latest,
    true,
    relative.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const forbidden = new Set([
    "process",
    "require",
    "eval",
    "Function",
    "fetch",
    "global",
    "globalThis",
    "XMLHttpRequest",
    "WebSocket",
    "window",
    "navigator",
  ]);
  const visit = (node) => {
    if (ts.isIdentifier(node) && forbidden.has(node.text))
      throw new Error(`Forbidden runtime capability ${node.text}: ${relative}`);
    if (node.kind === ts.SyntaxKind.ImportKeyword)
      throw new Error(`Dynamic import is forbidden: ${relative}`);
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier
    ) {
      const specifier = node.moduleSpecifier.text;
      if (
        !specifier.startsWith(".") &&
        !["react", "path"].includes(specifier) &&
        !(relative === "src/fixture/api.tsx" && specifier === "@raycast/api")
      )
        throw new Error(`Disallowed import ${specifier}: ${relative}`);
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const name = node.tagName.getText(file);
      if (
        /^(Action|List|ActionPanel)(\.|$)/.test(name) &&
        !UI_MEMBERS.has(name)
      )
        throw new Error(`Unreviewed native UI member ${name}: ${relative}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (
    text.includes("vesslo://") ||
    text.includes("raycast_data.json") ||
    text.includes("/Applications/") ||
    text.includes("/bin/brew")
  )
    throw new Error(`Production target in fixture source: ${relative}`);
}

function entrySource(command) {
  return `export { default } from "./original/${command}";\nexport { getFixtureSnapshot, setFixtureElapsed } from "./fixture/scenarios";\nexport { getFixtureEvents } from "./fixture/events";\n`;
}
function configSource(scenario, fixtureId) {
  return `export const scenario = ${JSON.stringify(scenario)};\nexport const fixtureId = ${JSON.stringify(fixtureId)};\n`;
}
function expectedSources(scenario, fixtureId) {
  if (!SCENARIOS.includes(scenario))
    throw new Error("Unknown fixture scenario.");
  const output = {};
  for (const source of SOURCES)
    output[`src/original/${source}`] = transformSource(
      fs.readFileSync(path.join(ROOT, "src", source), "utf8"),
      source,
    );
  for (const [destination, template] of Object.entries(TEMPLATES))
    output[destination] = fs.readFileSync(
      path.join(__dirname, template),
      "utf8",
    );
  for (const command of COMMANDS)
    output[`src/${command}.tsx`] = entrySource(command);
  output["src/fixture/config.ts"] = configSource(scenario, fixtureId);
  return output;
}
function fixtureRoot(directory) {
  const absolute = path.resolve(directory);
  const base = path.join(ROOT, ".ui-fixtures");
  if (
    path.dirname(absolute) !== base ||
    fs.realpathSync(absolute) !== absolute ||
    fs.lstatSync(base).isSymbolicLink()
  )
    throw new Error(
      "Fixture must be a direct, non-symlink child of .ui-fixtures.",
    );
  return absolute;
}
function listFiles(directory, relative = "") {
  return fs
    .readdirSync(path.join(directory, relative), { withFileTypes: true })
    .flatMap((entry) => {
      const name = posix(path.join(relative, entry.name));
      if (entry.isSymbolicLink())
        throw new Error(`Symlink in fixture artifact: ${name}`);
      return entry.isDirectory() ? listFiles(directory, name) : [name];
    })
    .sort();
}

module.exports = {
  ROOT,
  BASELINE,
  sourceRevision,
  SCENARIOS,
  COMMANDS,
  SOURCES,
  TEMPLATES,
  UI_EXPORTS,
  sha256,
  transformSource,
  assertSafeSource,
  entrySource,
  configSource,
  expectedSources,
  fixtureRoot,
  listFiles,
};
