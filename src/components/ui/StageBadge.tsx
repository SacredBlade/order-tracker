"use client";

// Small pill that shows which stage an order is in (used in search + audit).
import { STAGES, type StageNumber } from "@/lib/config";

const HUE: Record<number, string> = {
  1: "var(--color-stage1)",
  2: "var(--color-stage2)",
  3: "var(--color-stage3)",
  4: "var(--color-stage4)",
};

export default function StageBadge({ stage }: { stage: number }) {
  const color = HUE[stage] ?? "var(--color-ink-soft)";
  const label = STAGES[stage as StageNumber]?.tab ?? `Stage ${stage}`;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        fontSize: "0.75rem",
        fontWeight: 560,
        color: "var(--color-ink-soft)",
        background: "var(--color-sunken)",
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-pill)",
        padding: "0.2rem 0.6rem",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}
