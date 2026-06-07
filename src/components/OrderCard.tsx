"use client";

// One order. Shows its details, time-in-stage, an amber "stuck" highlight, its
// batches (once it has them), and the action buttons for its stage.
import { useEffect, useRef } from "react";
import { STAGES, type StageNumber } from "@/lib/config";
import { formatDateTime, isStuck, timeInStage } from "@/lib/time";
import type { Batch, Order } from "@/lib/types";

export default function OrderCard({
  order,
  batches,
  now,
  highlight,
  inGroup = false,
  selectable = false,
  selected = false,
  onToggleSelect,
  onMove,
  onEdit,
  onDelete,
  onReopen,
}: {
  order: Order;
  batches: Batch[];
  now: number;
  highlight: boolean;
  inGroup?: boolean;        // true when this card sits inside a group (group moves it)
  selectable?: boolean;     // true when "Select" mode is on
  selected?: boolean;
  onToggleSelect?: () => void;
  onMove: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReopen: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const completed = order.stage === 4;
  const stuck = !completed && isStuck(order.stage_entered_at, now);
  const moveLabel = STAGES[order.stage as StageNumber]?.moveButton ?? "";

  // When jumped-to from search, scroll into view.
  useEffect(() => {
    if (highlight) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlight]);

  return (
    <div
      ref={ref}
      style={{
        border: `1px solid ${stuck ? "var(--color-warn-line)" : "var(--color-line)"}`,
        background: stuck ? "var(--color-warn-bg)" : "var(--color-card)",
        borderRadius: "var(--radius-box)",
        padding: "1rem 1.1rem",
        boxShadow: highlight ? "0 0 0 3px var(--color-accent-soft), 0 0 0 1px var(--color-accent)" : "none",
        transition: "box-shadow 0.3s var(--ease-out-quint)",
      }}
    >
      {/* Top line: order number + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.75rem" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem" }}>
          {selectable && (
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              aria-label={`Select order ${order.order_number}`}
              style={{ width: 17, height: 17, cursor: "pointer", flexShrink: 0 }}
            />
          )}
          <span className="mono" style={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
            {order.order_number}
          </span>
        </span>
        {completed ? (
          <span style={{ fontSize: "0.8rem", color: "var(--color-ink-faint)", whiteSpace: "nowrap" }}>
            Completed {formatDateTime(order.completed_at)}
          </span>
        ) : (
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 560,
              whiteSpace: "nowrap",
              color: stuck ? "var(--color-warn-ink)" : "var(--color-ink-faint)",
            }}
          >
            {stuck ? "⚠ " : ""}
            {timeInStage(order.stage_entered_at, now)}
          </span>
        )}
      </div>

      {/* Customer · Destination */}
      <div style={{ fontSize: "0.9rem", color: "var(--color-ink-soft)", marginTop: "0.3rem" }}>
        <span style={{ color: "var(--color-ink)", fontWeight: 540 }}>{order.customer || "—"}</span>
        {"  ·  "}
        {order.destination || "—"}
      </div>

      {/* Notes */}
      {order.notes && (
        <p
          style={{
            margin: "0.7rem 0 0",
            fontSize: "0.87rem",
            color: "var(--color-ink-soft)",
            background: "var(--color-sunken)",
            border: "1px solid var(--color-line)",
            borderRadius: "10px",
            padding: "0.55rem 0.7rem",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}
        >
          {order.notes}
        </p>
      )}

      {/* Batches (shown from stage 3 onward) */}
      {batches.length > 0 && (
        <div style={{ marginTop: "0.7rem" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-ink-faint)", marginBottom: "0.35rem" }}>
            Batches
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.25rem" }}>
            {batches.map((b) => (
              <li key={b.id} style={{ fontSize: "0.85rem", color: "var(--color-ink-soft)" }}>
                <span className="mono" style={{ color: "var(--color-ink)" }}>{b.code || "—"}</span>
                {"  "}
                {b.product}
                {b.packaging ? ` · ${b.packaging}` : ""}
                {"  "}
                <span className="tabular">×{b.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.95rem", flexWrap: "wrap" }}>
        {completed ? (
          <button className="btn btn-primary btn-md" onClick={onReopen}>
            Reopen
          </button>
        ) : inGroup ? (
          // Orders in a group are moved together from the group's button above.
          <span style={{ fontSize: "0.8rem", color: "var(--color-ink-faint)", alignSelf: "center" }}>
            Moves with group
          </span>
        ) : (
          <button
            className={`btn btn-md ${order.stage === 3 ? "btn-go" : "btn-primary"}`}
            onClick={onMove}
          >
            {moveLabel}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-md" onClick={onEdit}>
          Edit
        </button>
        <button className="btn btn-danger-ghost btn-md" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
