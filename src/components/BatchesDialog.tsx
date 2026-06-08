"use client";

// Opens when moving an order (or a whole group) from Stage 2 to Stage 3.
// For a group, each order gets its own batch list. Confirm to move them all.
import { useState } from "react";
import Dialog from "./ui/Dialog";
import BatchRows, { blankBatch } from "./BatchRows";
import type { DraftBatch, Order } from "@/lib/types";

export default function BatchesDialog({
  orders,
  onConfirm,
  onCancel,
}: {
  orders: Order[];
  onConfirm: (batchesByOrder: Record<string, DraftBatch[]>) => Promise<void>;
  onCancel: () => void;
}) {
  const isGroup = orders.length > 1;
  const [rowsByOrder, setRowsByOrder] = useState<Record<string, DraftBatch[]>>(() =>
    Object.fromEntries(orders.map((o) => [o.id, [blankBatch()]]))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setRowsFor(orderId: string, rows: DraftBatch[]) {
    setRowsByOrder((prev) => ({ ...prev, [orderId]: rows }));
  }

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(rowsByOrder);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <Dialog
      title={isGroup ? `Book ${orders.length} orders for pickup` : "Book for pickup — add batches"}
      onClose={onCancel}
      wide
      footer={
        <>
          <button className="btn btn-outline btn-md" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary btn-md" onClick={confirm} disabled={busy}>
            {busy ? "Saving…" : "Confirm & move to Awaiting Pickup"}
          </button>
        </>
      }
    >
      <p style={{ margin: "0 0 1rem", color: "var(--color-ink-soft)", fontSize: "0.9rem" }}>
        Add the batches being shipped, then confirm.
      </p>

      {error && (
        <p style={{ margin: "0 0 1rem", color: "var(--color-danger)", fontSize: "0.85rem" }}>
          {error}
        </p>
      )}

      <div style={{ display: "grid", gap: "1.25rem" }}>
        {orders.map((o) => (
          <div key={o.id}>
            <div
              style={{
                fontSize: "0.85rem",
                marginBottom: "0.5rem",
                color: "var(--color-ink-soft)",
              }}
            >
              Order{" "}
              <span className="mono" style={{ color: "var(--color-ink)", fontWeight: 600 }}>
                {o.order_number}
              </span>
            </div>
            <BatchRows rows={rowsByOrder[o.id]} setRows={(rows) => setRowsFor(o.id, rows)} />
          </div>
        ))}
      </div>
    </Dialog>
  );
}
