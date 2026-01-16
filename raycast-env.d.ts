/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `browse-by-tag` command */
  export type BrowseByTag = ExtensionPreferences & {}
  /** Preferences accessible in the `bulk-homebrew-update` command */
  export type BulkHomebrewUpdate = ExtensionPreferences & {}
  /** Preferences accessible in the `updates` command */
  export type Updates = ExtensionPreferences & {}
  /** Preferences accessible in the `search-apps` command */
  export type SearchApps = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `browse-by-tag` command */
  export type BrowseByTag = {}
  /** Arguments passed to the `bulk-homebrew-update` command */
  export type BulkHomebrewUpdate = {}
  /** Arguments passed to the `updates` command */
  export type Updates = {}
  /** Arguments passed to the `search-apps` command */
  export type SearchApps = {}
}

