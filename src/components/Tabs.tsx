"use client";

// The four stage tabs with live counts.
import { ALL_STAGES, STAGES, type StageNumber } from "@/lib/config";

const HUE: Record<number, string> = {
  1: "var(--color-stage1)",
  2: "var(--color-stage2)",
  3: "var(--color-stage3)",
  4: "var(--color-stage4)",
};

export default function Tabs({
  active,
  counts,
  onChange,
}: {
  active: StageNumber;
  counts: Record<number, number>;
  onChange: (stage: StageNumber) => void;
}) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: "0.35rem",
        flexWrap: "wrap",
        borderBottom: "1px solid var(--color-line)",
        paddingBottom: "0.5rem",
        marginBottom: "1.1rem",
      }}
    >
      {ALL_STAGES.map((s) => {
        const isActive = active === s;
        return (
          <button
            key={s}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(s)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              border: "none",
              background: isActive ? "var(--color-ink)" : "transparent",
              color: isActive ? "var(--color-card)" : "var(--color-ink-soft)",
              fontWeight: 560,
              fontSize: "0.9rem",
              padding: "0.55rem 0.85rem",
              borderRadius: "var(--radius-pill)",
              cursor: "pointer",
              transition: "background 0.15s var(--ease-out-quint), color 0.15s var(--ease-out-quint)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: HUE[s],
                flexShrink: 0,
              }}
            />
            {STAGES[s as StageNumber].tab}
            <span
              className="tabular"
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: isActive ? "var(--color-card)" : "var(--color-ink-faint)",
                opacity: isActive ? 0.85 : 1,
              }}
            >
              ({counts[s] ?? 0})
            </span>
          </button>
        );
      })}
    </div>
  );
}
