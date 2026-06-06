// =============================================================================
//  CONFIG  —  THE ONE PLACE TO CHANGE TEXT, THRESHOLDS, AND BATCH RULES
//  You do not need to touch any other file to change wording or the rules below.
// =============================================================================

// ---- App title (top-left of the bar) ---------------------------------------
export const APP_TITLE = "Order Tracker";

// ---- STUCK-ORDER THRESHOLD --------------------------------------------------
// If an order sits in the same stage longer than this many days, its card turns
// amber so it stands out. Change this single number to whatever you like.
export const STUCK_THRESHOLD_DAYS = 3;

// ---- STAGES -----------------------------------------------------------------
// Stage numbers are fixed (1,2,3 = active, 4 = completed). You may rename the
// labels and the "move" button text freely. Counts in the tabs update live.
export const STAGES = {
  1: {
    tab: "1. Order Received",        // tab label (the count is added automatically)
    moveButton: "Packing List Sent → Next", // button on the card
  },
  2: {
    tab: "2. Sales Documents",
    moveButton: "Booked for Pickup → Next", // this one opens the Batches dialog first
  },
  3: {
    tab: "3. Awaiting Pickup",
    moveButton: "Picked Up — Complete",
  },
  4: {
    tab: "Completed",
    moveButton: "", // completed orders are not moved forward
  },
} as const;

export type StageNumber = 1 | 2 | 3 | 4;
export const ACTIVE_STAGES: StageNumber[] = [1, 2, 3];
export const ALL_STAGES: StageNumber[] = [1, 2, 3, 4];

// ---- BATCH CODE RULES -------------------------------------------------------
// A batch code is: LETTERS + 4 DIGITS + "B"   e.g.  XP1234B, OXP0007B, IM1010B
// We read the FULL letter prefix (all the letters before the digits) and match
// it EXACTLY against the keys below.
//
//  - A "simple" prefix maps straight to a product + a list of packaging options.
//  - A "chooser" prefix (like IM) is shared by several products, so the user
//    first picks which product, then sees that product's packaging options.
//
// To add or edit a prefix, just edit this object.
export type SimpleRule = {
  kind: "simple";
  product: string;
  packaging: string[];
};
export type ChooserRule = {
  kind: "chooser";
  // each option = a product the user can pick, with its own packaging list
  products: { product: string; packaging: string[] }[];
};
export type PrefixRule = SimpleRule | ChooserRule;

export const PREFIX_RULES: Record<string, PrefixRule> = {
  XP: {
    kind: "simple",
    product: "XP",
    packaging: ["501kg bag", "12.5kg box"],
  },
  OXP: {
    kind: "simple",
    product: "Coco",
    packaging: ["200kg drum", "20kg pail"],
  },
  IM: {
    kind: "chooser",
    products: [
      { product: "JJ", packaging: ["170kg drum", "17kg pail"] },
      { product: "CCT", packaging: ["180kg drum", "18kg pail"] },
      { product: "AB", packaging: ["180kg drum", "18kg pail"] },
    ],
  },
};
