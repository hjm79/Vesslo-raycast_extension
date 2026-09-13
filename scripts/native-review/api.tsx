import {
  Action as NativeAction,
  ActionPanel,
  Detail,
  Color,
  Icon,
  List as NativeList,
  useNavigation,
  Toast,
  showToast,
} from "@raycast/api";
import { createElement, ComponentProps } from "react";

export { ActionPanel, Color, Icon, Detail, useNavigation, Toast, showToast };

// Preserve the SDK's type namespace while wrapping only its runtime list surface.
export namespace List {
  export namespace Item {
    export type Accessory = NativeList.Item.Accessory;
  }
}

function CopyToClipboard(props: { title: string; content: string }) {
  return createElement(NativeAction, {
    title: props.title,
    onAction: async () => {
      await showToast({
        style: Toast.Style.Failure,
        title: "Clipboard Disabled in Native Review Fixture",
      });
    },
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
