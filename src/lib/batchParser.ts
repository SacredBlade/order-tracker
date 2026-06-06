// Parses a batch code and returns what packaging options to show.
// Code format: LETTERS + 4 DIGITS + "B"  (e.g. XP1234B). Matching is
// case-insensitive; we read the FULL letter prefix and look it up exactly.

import { PREFIX_RULES, type PrefixRule } from "./config";

export type ParseResult =
  | { status: "invalid" } // doesn't look like a code yet
  | { status: "unknown"; prefix: string } // valid shape, prefix not in our list -> manual entry
  | { status: "simple"; prefix: string; product: string; packaging: string[] }
  | {
      status: "chooser";
      prefix: string;
      products: { product: string; packaging: string[] }[];
    };

const CODE_RE = /^([A-Za-z]+)(\d{4})B$/;

export function parseBatchCode(rawCode: string): ParseResult {
  const code = rawCode.trim().toUpperCase();
  const match = code.match(CODE_RE);
  if (!match) return { status: "invalid" };

  const prefix = match[1]; // the FULL run of letters, not a substring
  const rule: PrefixRule | undefined = PREFIX_RULES[prefix];

  if (!rule) return { status: "unknown", prefix };

  if (rule.kind === "simple") {
    return { status: "simple", prefix, product: rule.product, packaging: rule.packaging };
  }
  return { status: "chooser", prefix, products: rule.products };
}
