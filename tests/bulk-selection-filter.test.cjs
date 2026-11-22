const { test } = require("node:test");
const assert = require("node:assert/strict");
const { join } = require("node:path");
const Module = require("node:module");
const React = require("react");
const { schema2Data, uuid } = require("./schema2-test-data.cjs");
const fixture = require("./fixtures/current-app.json");

let state;
let hookValues = [];
let hookIndex = 0;
const action = (props) => React.createElement("Action", props);
const list = (props) => React.createElement("List", props);
const api = {
  Action: Object.assign(action, {
    Push: "Action.Push",
    CopyToClipboard: "Action.CopyToClipboard",
  }),
  ActionPanel: (props) => props.children,
  List: Object.assign(list, {
    Item: Object.assign((props) => React.createElement("List.Item", props), {
      Detail: "List.Item.Detail",
    }),
    Section: "List.Section",
    EmptyView: "List.EmptyView",
    Dropdown: Object.assign((props) => props.children, {
      Item: "List.Dropdown.Item",
    }),
  }),
  Color: new Proxy({}, { get: (_, key) => key }),
  Icon: new Proxy({}, { get: (_, key) => key }),
};
const realLoad = Module._load;
let Command;
try {
  Module._load = function (request) {
    if (request === "@raycast/api") return api;
    if (request === "react")
      return {
        ...React,
        useState: (initial) => {
          const index = hookIndex++;
          if (!(index in hookValues)) hookValues[index] = initial;
          return [
            hookValues[index],
            (next) => {
              hookValues[index] =
                typeof next === "function" ? next(hookValues[index]) : next;
            },
          ];
        },
      };
    if (request.endsWith("/utils/useVessloData"))
      return {
        useVessloData: () => ({
          data: state.data,
          state,
          isLoading: false,
          refresh: async () => state,
        }),
      };
    if (request.endsWith("/components/SharedAppListItem"))
      return {
        SharedAppListItem: (props) =>
          React.createElement("Candidate", {
            ...props,
            actions: [props.leadingActions, props.extraActions],
          }),
      };
    if (request.endsWith("/components/DataStateNotice"))
      return {
        DataStateNotice: () => null,
        ReloadDataAction: () => null,
      };
    if (request.endsWith("/components/HomebrewRequestReview"))
      return { HomebrewRequestReview: () => null };
    if (request.endsWith("/browse-by-tag")) return { TaggedApps: () => null };
    if (request.endsWith("/handoff-requests"))
      return { __esModule: true, default: () => null };
    if (request.endsWith("/utils/actions"))
      return {
        openInVesslo: () => assert.fail("Native app opening is forbidden"),
      };
    return realLoad.apply(this, arguments);
  };
  Command = require(
    join(process.env.VESSLO_TEST_BUILD, "bulk-homebrew-update.js"),
  ).default;
} finally {
  Module._load = realLoad;
}

function app(name) {
  return {
    ...fixture,
    id: uuid(name),
    name,
    bundleId: `com.example.${name.toLowerCase()}`,
    path: `/Applications/${name}.app`,
    homebrewCask: name.toLowerCase(),
  };
}
function setup(apps = [app("Alpha"), app("Beta"), app("Gamma")]) {
  hookValues = [];
  state = {
    status: "ready",
    data: schema2Data(apps),
    pathAvailability: Object.fromEntries(
      apps.map((item) => [item.path, "available"]),
    ),
  };
  return apps;
}
function render() {
  hookIndex = 0;
  return Command();
}
function collect(node, type, results = []) {
  if (!node || typeof node !== "object") return results;
  if (Array.isArray(node)) {
    node.forEach((child) => collect(child, type, results));
    return results;
  }
  if (typeof node.type === "function")
    return collect(node.type(node.props), type, results);
  if (node.type === type) results.push(node.props);
  collect(node.props?.children, type, results);
  collect(node.props?.actions, type, results);
  return results;
}
function takeAction(tree, title) {
  const found = collect(tree, "Action").find((item) => item.title === title);
  assert.ok(found, `Missing action: ${title}`);
  found.onAction();
}
function select(tree, name) {
  const row = collect(tree, "Candidate").find((item) => item.app.name === name);
  assert.ok(row, `Missing candidate: ${name}`);
  takeAction(row.actions, "Select for Review");
}
function names(tree) {
  return collect(tree, "Candidate").map((item) => item.app.name);
}
function review(tree) {
  return collect(tree, "Action.Push").find((item) =>
    item.title.startsWith("Review "),
  );
}
function changeFilter(tree, value) {
  tree.props.searchBarAccessory.props.onChange(value);
}

test("Selected Only reveals search-hidden selections and searches only the selected subset", () => {
  const apps = setup();
  select(render(), "Alpha");
  select(render(), "Beta");
  let tree = render();
  tree.props.onSearchTextChange("Gamma");
  tree = render();
  assert.deepEqual(names(tree), ["Gamma"]);
  assert.deepEqual(review(tree).target.props.apps, apps.slice(0, 2));
  assert.match(
    collect(tree, "List.Section").find(
      (section) => section.title === "Homebrew Review",
    ).subtitle,
    /3 candidates · 2 selected · 1 shown/,
  );

  const snapshot = review(tree).target.props.data;
  changeFilter(tree, "selected");
  tree = render();
  assert.equal(tree.props.searchText, "");
  assert.equal(tree.props.searchBarAccessory.props.storeValue, false);
  assert.deepEqual(names(tree), ["Alpha", "Beta"]);
  assert.equal(review(tree).target.props.data, snapshot);
  assert.match(
    collect(tree, "List.Section").find(
      (section) => section.title === "Homebrew Review",
    ).subtitle,
    /3 candidates · 2 selected · 2 shown/,
  );

  tree.props.onSearchTextChange("Beta");
  tree = render();
  assert.deepEqual(names(tree), ["Beta"]);
  assert.ok(
    !collect(tree, "Action").some(
      (item) => item.title === "Select Matching Apps",
    ),
    "Searching selected rows must not offer an action that replaces hidden selections",
  );
  assert.deepEqual(review(tree).target.props.apps, apps.slice(0, 2));
  assert.match(
    collect(tree, "List.Section").find(
      (section) => section.title === "Homebrew Review",
    ).subtitle,
    /3 candidates · 2 selected · 1 shown/,
  );
  assert.equal(
    collect(tree, "List.Item")[0].subtitle,
    "Select up to 16 apps",
    "Filtering must not be reported as selection drift",
  );
  changeFilter(tree, "all");
  tree = render();
  assert.equal(tree.props.searchText, "Beta");
  assert.deepEqual(review(tree).target.props.apps, apps.slice(0, 2));
});

test("empty selection and unmatched selected search have distinct recoverable empty states", () => {
  setup();
  changeFilter(render(), "selected");
  let tree = render();
  let empty = collect(tree, "List.EmptyView")[0];
  assert.equal(empty.title, "No Apps Selected");
  assert.match(empty.description, /3 candidates · 0 selected · 0 shown/);
  assert.equal(collect(tree, "List.Item").length, 0);
  takeAction(tree, "Show All Candidates");
  select(render(), "Alpha");
  changeFilter(render(), "selected");
  render().props.onSearchTextChange("Beta");
  tree = render();
  empty = collect(tree, "List.EmptyView")[0];
  assert.equal(empty.title, "No Matching Selected Apps");
  assert.match(empty.description, /3 candidates · 1 selected · 0 shown/);
  assert.equal(review(tree).target.props.apps[0].name, "Alpha");
  takeAction(tree, "Clear Search");
  tree = render();
  assert.deepEqual(names(tree), ["Alpha"]);
  takeAction(collect(tree, "Candidate")[0].actions, "Remove from Selection");
  assert.equal(
    collect(render(), "List.EmptyView")[0].title,
    "No Apps Selected",
  );
});

test("selected filter keeps identity drift blocked and explains vanished current candidates", () => {
  const apps = setup();
  select(render(), "Alpha");
  changeFilter(render(), "selected");
  state.data = {
    ...state.data,
    apps: apps.slice(1),
    updateCount: 2,
    inventoryRevision: state.data.inventoryRevision + 1,
  };
  const tree = render();
  const empty = collect(tree, "List.EmptyView")[0];
  assert.equal(empty.title, "Selected Apps Are No Longer Candidates");
  assert.match(empty.description, /2 candidates · 1 selected · 0 shown/);
  assert.match(empty.description, /Inventory changed/);
  assert.equal(review(tree), undefined);
  takeAction(tree, "Clear Selection");
  assert.equal(
    collect(render(), "List.EmptyView")[0].title,
    "No Apps Selected",
  );
});

test("Selected Only preserves readonly blocking while allowing removal", () => {
  setup();
  select(render(), "Alpha");
  changeFilter(render(), "selected");
  state.status = "stale";
  const tree = render();
  assert.deepEqual(names(tree), ["Alpha"]);
  assert.equal(review(tree), undefined);
  assert.ok(
    !collect(tree, "Action").some(
      (item) => item.title === "Select Matching Apps",
    ),
  );
  takeAction(collect(tree, "Candidate")[0].actions, "Remove from Selection");
  assert.equal(
    collect(render(), "List.EmptyView")[0].title,
    "No Apps Selected",
  );
});

test("filter transitions do not bypass the 16-target limit or replace the exact review selection", () => {
  setup(Array.from({ length: 17 }, (_, index) => app(`App${index + 1}`)));
  for (let index = 1; index <= 16; index++) select(render(), `App${index}`);
  changeFilter(render(), "selected");
  let tree = render();
  assert.equal(names(tree).length, 16);
  assert.equal(review(tree).target.props.apps.length, 16);
  changeFilter(tree, "all");
  select(render(), "App17");
  tree = render();
  assert.equal(review(tree).target.props.apps.length, 16);
  assert.equal(
    collect(tree, "List.Item")[0].subtitle,
    "One review request can contain at most 16 apps.",
  );
  assert.ok(
    !review(tree).target.props.apps.some((item) => item.name === "App17"),
  );
});
