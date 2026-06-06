"use client";

// Opens when moving an order from Stage 2 to Stage 3. Collect one or more
// batches, then confirm to move the order forward.
import { useState } from "react";
import Dialog from "./ui/Dialog";
import BatchRows, { blankBatch } from "./BatchRows";
import type { DraftBatch, Order } from "@/lib/types";

export default function BatchesDialog({
  order,
  onConfirm,
  onCancel,
}: {
  order: Order;
  onConfirm: (batches: DraftBatch[]) => void;
  onCancel: () => void;
}) {
  const [rows, setRows] = useState<DraftBatch[]>([blankBatch()]);
  const [busy, setBusy] = useState(false);

  function confirm() {
    setBusy(true);
    onConfirm(rows);
  }

  return (
    <Dialog
      title="Book for pickup — add batches"
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
        Order <span className="mono" style={{ color: "var(--color-ink)" }}>{order.order_number}</span>.
        Add the batches being shipped, then confirm.
      </p>
      <BatchRows rows={rows} setRows={setRows} />
    </Dialog>
  );
}
