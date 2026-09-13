const vm = require("node:vm");
const path = require("node:path");

const element = (type, props, ...children) => ({
  type,
  props: children.length
    ? { ...props, children: children.length === 1 ? children[0] : children }
    : (props ?? {}),
});

function outsideLiteralCode(markdown) {
  let plain = "";
  let offset = 0;
  while (offset < markdown.length) {
    if (markdown[offset] !== "`") {
      plain += markdown[offset++];
      continue;
    }
    let contentStart = offset;
    while (markdown[contentStart] === "`") contentStart++;
    const width = contentStart - offset;
    let closing = contentStart;
    let found = false;
    while (closing < markdown.length) {
      if (markdown[closing] !== "`") {
        closing++;
        continue;
      }
      let end = closing;
      while (markdown[end] === "`") end++;
      if (end - closing === width) {
        found = true;
        break;
      }
      closing = end;
    }
    if (!found || /[\r\n]/.test(markdown.slice(contentStart, closing)))
      throw new Error("Invalid literal code span in fixture Markdown.");
    plain += " ";
    offset = closing + width;
  }
  return plain;
}

function createNativeApi() {
  const components = new Map();
  const allowed = new Set([
    "Detail",
    "Action",
    "Action.Push",
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
  const component = (name) => {
    if (!allowed.has(name)) throw new Error(`Forbidden native API: ${name}`);
    if (components.has(name)) return components.get(name);
    const render = (props) => {
      if (name === "List.Dropdown" && props.storeValue !== false)
        throw new Error("Fixture dropdown must disable native persistence.");
      const inspect = (value, key) => {
        if (
          key === "fileIcon" &&
          (typeof value !== "string" ||
            !/^\/__vesslo_fixture__\/[a-zA-Z0-9-]+\.app$/.test(value))
        )
          throw new Error("Non-synthetic native file icon.");
        if (typeof value === "string" && ["markdown", "source"].includes(key)) {
          const displayed =
            key === "markdown" ? outsideLiteralCode(value) : value;
          if (
            /(?:https?|file|vesslo|raycast|data):|\]\([^)]*\)|<[^>]+>/.test(
              displayed,
            )
          )
            throw new Error(
              "External image or Markdown target in native UI props.",
            );
        }
        if (value && typeof value === "object" && !value.type)
          for (const [childKey, child] of Object.entries(value))
            inspect(child, childKey);
      };
      for (const [key, value] of Object.entries(props)) inspect(value, key);
      return element(name, props);
    };
    const proxy = new Proxy(render, {
      get(target, key) {
        if (key === "name") return name;
        if (typeof key !== "string")
          throw new Error("Unexpected native component symbol access.");
        return component(`${name}.${key}`);
      },
    });
    components.set(name, proxy);
    return proxy;
  };
  return new Proxy(
    {},
    {
      get(_target, key) {
        if (key === "useNavigation")
          return () => ({ push: () => {}, pop: () => {} });
        if (key === "Icon" || key === "Color")
          return new Proxy(
            {},
            { get: (_, value) => `${key}.${String(value)}` },
          );
        return component(String(key));
      },
    },
  );
}

async function exerciseBundle(code, command, scenario) {
  const instances = new Map();
  const effects = [];
  const cleanups = [];
  const timers = new Map();
  let timerId = 0;
  let active;
  let stateUpdates = 0;
  const slot = (initialize) => {
    if (!active) throw new Error("Hook called outside a fixture component.");
    const index = active.index++;
    if (!Object.hasOwn(active.values, index))
      active.values[index] = initialize();
    return { instance: active, index };
  };
  const React = {
    createElement: element,
    Fragment: Symbol.for("fixture.fragment"),
    useState: (initialize) => {
      const { instance, index } = slot(() =>
        typeof initialize === "function" ? initialize() : initialize,
      );
      return [
        instance.values[index],
        (next) => {
          const value =
            typeof next === "function" ? next(instance.values[index]) : next;
          if (value !== instance.values[index]) {
            instance.values[index] = value;
            stateUpdates += 1;
          }
        },
      ];
    },
    useRef: (value) => {
      const { instance, index } = slot(() => ({ current: value }));
      return instance.values[index];
    },
    useMemo: (callback) => callback(),
    useCallback: (callback) => callback,
    useEffect: (callback) => {
      const { instance, index } = slot(() => false);
      if (!instance.values[index]) {
        instance.values[index] = true;
        effects.push(callback);
      }
    },
  };
  const api = createNativeApi();
  const exports = {};
  const context = vm.createContext(
    {
      module: { exports },
      exports,
      require: (name) => {
        if (name === "@raycast/api") return api;
        if (name === "react") return React;
        if (name === "react/jsx-runtime")
          return {
            jsx: (type, props) => element(type, props),
            jsxs: (type, props) => element(type, props),
            Fragment: React.Fragment,
          };
        if (name === "path")
          return Object.freeze({
            isAbsolute: path.isAbsolute,
            posix: Object.freeze({ normalize: path.posix.normalize }),
          });
        throw new Error(`Forbidden fixture require: ${name}`);
      },
      console: Object.freeze({ info: () => {} }),
      Buffer: Object.freeze({ byteLength: Buffer.byteLength }),
      setTimeout: (callback) => {
        timers.set(++timerId, callback);
        return timerId;
      },
      clearTimeout: (id) => {
        timers.delete(id);
      },
    },
    { codeGeneration: { strings: false, wasm: false } },
  );
  vm.runInContext(code, context, { timeout: 2000 });
  const fixture = context.module.exports;
  function render() {
    const nodes = [];
    const renderedTags = new Set();
    const walk = (node, location) => {
      if (Array.isArray(node)) {
        node.forEach((child, index) => walk(child, `${location}/${index}`));
        return;
      }
      if (node == null || typeof node !== "object") return;
      if (typeof node.type === "function") {
        const key = `${location}:${node.type.name}`;
        const previous = active;
        active = instances.get(key) ?? { values: [], index: 0 };
        active.index = 0;
        instances.set(key, active);
        let rendered;
        try {
          rendered = node.type(node.props);
        } finally {
          active = previous;
        }
        walk(rendered, `${location}/render`);
        return;
      }
      nodes.push(node);
      for (const key of [
        "children",
        "actions",
        "target",
        "detail",
        "searchBarAccessory",
      ]) {
        const child = node.props?.[key];
        // Multiple rows offer the same tag push. Exercise each distinct tag view once
        // per render, instead of expanding a quadratic number of identical subtrees.
        if (key === "target" && child?.type?.name === "TaggedApps") {
          const tag = child.props?.tag;
          if (renderedTags.has(tag)) continue;
          renderedTags.add(tag);
        }
        walk(child, `${location}/${key}`);
      }
    };
    walk(element(fixture.default, {}), "root");
    return nodes;
  }
  async function settle() {
    while (effects.length) {
      const cleanup = effects.shift()();
      if (typeof cleanup === "function") cleanups.push(cleanup);
    }
    await Promise.resolve();
    await Promise.resolve();
  }
  async function tick(elapsed) {
    fixture.setFixtureElapsed(elapsed);
    const callbacks = [...timers.values()];
    timers.clear();
    await Promise.all(callbacks.map((callback) => callback()));
  }
  render();
  await settle();
  let nodes = render();
  await settle();
  nodes = render();
  const snapshot = fixture.getFixtureSnapshot();
  for (const app of snapshot.data?.apps ?? []) {
    if (
      !app.path.startsWith("/__vesslo_fixture__/") ||
      !app.bundleId.startsWith("com.example.vesslofixture.") ||
      app.icon !== null
    )
      throw new Error("Non-synthetic fixture app.");
  }
  const beforeIdle = stateUpdates;
  await tick(3000);
  render();
  if (stateUpdates !== beforeIdle)
    throw new Error(
      "Unchanged fixture polling published a React state update.",
    );
  let callbacks = 0;
  for (const node of nodes) {
    if (typeof node.props?.onAction === "function") {
      await node.props.onAction();
      callbacks += 1;
    }
    if (typeof node.props?.onSearchTextChange === "function") {
      node.props.onSearchTextChange("Fixture");
      callbacks += 1;
    }
    if (
      node.type === "List.Dropdown" &&
      typeof node.props?.onChange === "function"
    ) {
      const item = nodes.find(
        (candidate) => candidate.type === "List.Dropdown.Item",
      );
      if (item) {
        node.props.onChange(item.props.value);
        callbacks += 1;
      }
    }
  }
  render();
  await settle();
  await tick(12000);
  render();
  if (
    scenario === "tag-becomes-empty" &&
    fixture.getFixtureSnapshot().data.apps.length !== 0
  )
    throw new Error("Tag-empty fixture did not transition.");
  for (const cleanup of cleanups.reverse()) cleanup();
  if (timers.size !== 0)
    throw new Error("Fixture hooks retained timers after unmount.");
  const events = fixture.getFixtureEvents();
  if (
    events.some(
      (event) =>
        !["review", "update", "open", "finder", "copy"].includes(event.kind),
    )
  )
    throw new Error("Unexpected simulated effect.");
  return {
    command,
    callbacksExercised: callbacks,
    simulatedIntents: events.length,
    unchangedPollingUpdates: 0,
    timersAfterUnmount: 0,
  };
}

module.exports = { createNativeApi, exerciseBundle };
