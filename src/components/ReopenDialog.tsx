"use client";

// In the Completed tab: pick which stage (1, 2 or 3) to send an order back to.
import { useState } from "react";
import Dialog from "./ui/Dialog";
import { ACTIVE_STAGES, STAGES } from "@/lib/config";
import type { Order } from "@/lib/types";

export default function ReopenDialog({
  order,
  onConfirm,
  onCancel,
}: {
  order: Order;
  onConfirm: (stage: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [stage, setStage] = useState<number>(3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(stage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <Dialog
      title="Reopen order"
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn-outline btn-md" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-md"
            onClick={confirm}
            disabled={busy}
          >
            {busy ? "Reopening…" : "Reopen order"}
          </button>
        </>
      }
    >
      <p style={{ margin: "0 0 1rem", color: "var(--color-ink-soft)" }}>
        Send order <span className="mono" style={{ color: "var(--color-ink)" }}>{order.order_number}</span> back to:
      </p>
      {error && (
        <p style={{ margin: "0 0 1rem", color: "var(--color-danger)", fontSize: "0.85rem" }}>
          {error}
        </p>
      )}
      <div style={{ display: "grid", gap: "0.6rem" }}>
        {ACTIVE_STAGES.map((s) => (
          <label
            key={s}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              padding: "0.7rem 0.85rem",
              border: `1px solid ${stage === s ? "var(--color-accent)" : "var(--color-line-strong)"}`,
              borderRadius: "var(--radius-box)",
              cursor: "pointer",
              background: stage === s ? "var(--color-accent-soft)" : "var(--color-card)",
            }}
          >
            <input
              type="radio"
              name="reopen-stage"
              checked={stage === s}
              onChange={() => setStage(s)}
            />
            <span style={{ fontWeight: 540 }}>{STAGES[s].tab}</span>
          </label>
        ))}
      </div>
    </Dialog>
  );
}
