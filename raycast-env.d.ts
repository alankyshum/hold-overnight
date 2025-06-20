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
  /** Preferences accessible in the `calculate-protective-put` command */
  export type CalculateProtectivePut = ExtensionPreferences & {
  /** Default Maximum Loss - Default maximum loss amount in dollars */
  "defaultMaxLoss": string,
  /** Default Holding Period - Default holding period (1w, 2w, 1m) */
  "defaultHoldingPeriod": "1w" | "2w" | "1m"
}
}

declare namespace Arguments {
  /** Arguments passed to the `calculate-protective-put` command */
  export type CalculateProtectivePut = {
  /** AAPL */
  "ticker": string,
  /** 150.00 */
  "stopLoss": string,
  /** 500 */
  "maxLoss": string
}
}

