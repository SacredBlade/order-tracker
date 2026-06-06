"use client";

// Used for both "Add Order" and "Edit". In edit mode it can also edit batches.
import { useState } from "react";
import Dialog from "./ui/Dialog";
import BatchRows, { blankBatch } from "./BatchRows";
import type { Batch, DraftBatch, Order } from "@/lib/types";

export default function AddEditOrderDialog({
  mode,
  order,
  existingBatches,
  onSave,
  onCancel,
}: {
  mode: "add" | "edit";
  order?: Order;
  existingBatches?: Batch[];
  onSave: (
    fields: { order_number: string; customer: string; destination: string; notes: string },
    batches: DraftBatch[] | null
  ) => Promise<void>;
  onCancel: () => void;
}) {
  const [orderNumber, setOrderNumber] = useState(order?.order_number ?? "");
  const [customer, setCustomer] = useState(order?.customer ?? "");
  const [destination, setDestination] = useState(order?.destination ?? "");
  const [notes, setNotes] = useState(order?.notes ?? "");
  const [rows, setRows] = useState<DraftBatch[]>(
    (existingBatches ?? []).map((b) => ({
      key: b.id,
      code: b.code,
      product: b.product,
      packaging: b.packaging,
      quantity: String(b.quantity),
    }))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === "edit";

  async function save() {
    if (orderNumber.trim() === "") {
      setError("Order number is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave(
        {
          order_number: orderNumber.trim(),
          customer: customer.trim(),
          destination: destination.trim(),
          notes: notes.trim(),
        },
        isEdit ? rows : null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <Dialog
      title={isEdit ? "Edit order" : "Add order"}
      onClose={onCancel}
      wide={isEdit}
      footer={
        <>
          <button className="btn btn-outline btn-md" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary btn-md" onClick={save} disabled={busy}>
            {busy ? "Saving…" : isEdit ? "Save changes" : "Add order"}
          </button>
        </>
      }
    >
      <div style={{ display: "grid", gap: "0.9rem" }}>
        <div>
          <label className="field-label" htmlFor="ord-num">
            Order number
          </label>
          <input
            id="ord-num"
            className="input mono"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Type the order number"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="ord-cust">
            Customer
          </label>
          <input
            id="ord-cust"
            className="input"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="ord-dest">
            Destination
          </label>
          <input
            id="ord-dest"
            className="input"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="ord-notes">
            Notes (optional)
          </label>
          <textarea
            id="ord-notes"
            className="textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth remembering about this order"
          />
        </div>

        {isEdit && (
          <div style={{ borderTop: "1px solid var(--color-line)", paddingTop: "1rem" }}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem" }}>Batches</h3>
            {rows.length === 0 ? (
              <button
                type="button"
                className="btn btn-outline btn-md"
                onClick={() => setRows([blankBatch()])}
              >
                + Add a batch
              </button>
            ) : (
              <BatchRows rows={rows} setRows={setRows} />
            )}
          </div>
        )}

        {error && (
          <p style={{ margin: 0, color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</p>
        )}
      </div>
    </Dialog>
  );
}
