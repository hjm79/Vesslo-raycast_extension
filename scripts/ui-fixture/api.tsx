import {
  Action as NativeAction,
  ActionPanel,
  Detail,
  Color,
  Icon,
  List as NativeList,
  useNavigation,
} from "@raycast/api";
import { createElement, ComponentProps } from "react";
import { recordIntent } from "./events";

export { ActionPanel, Color, Icon, Detail, useNavigation };

export namespace List {
  export namespace Item {
    export type Accessory = NativeList.Item.Accessory;
  }
}

function CopyToClipboard(props: { title: string; content: string }) {
  return createElement(NativeAction, {
    title: props.title,
    onAction: () => recordIntent("copy", props.content),
  });
}

export const Action = Object.assign(
  (props: ComponentProps<typeof NativeAction>) =>
    createElement(NativeAction, props),
  { Push: NativeAction.Push, CopyToClipboard },
);

const Dropdown = Object.assign(
  (props: ComponentProps<typeof NativeList.Dropdown>) =>
    createElement(NativeList.Dropdown, { ...props, storeValue: false }),
  { Item: NativeList.Dropdown.Item, Section: NativeList.Dropdown.Section },
);

export const List = Object.assign(
  (props: ComponentProps<typeof NativeList>) =>
    createElement(NativeList, props),
  {
    Item: NativeList.Item,
    Section: NativeList.Section,
    EmptyView: NativeList.EmptyView,
    Dropdown,
  },
);
