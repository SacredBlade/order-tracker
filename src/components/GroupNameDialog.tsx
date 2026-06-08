"use client";

// Asks for an optional group name when grouping selected orders.
import { useState } from "react";
import Dialog from "./ui/Dialog";

export default function GroupNameDialog({
  count,
  onConfirm,
  onCancel,
}: {
  count: number;
  onConfirm: (name: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(name.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <Dialog
      title={`Group ${count} orders`}
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
            {busy ? "Grouping…" : "Group together"}
          </button>
        </>
      }
    >
      <label className="field-label" htmlFor="group-name">
        Group name (optional)
      </label>
      <input
        id="group-name"
        className="input"
        placeholder="e.g. destination or shipment"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            void confirm();
          }
        }}
      />
      {error && (
        <p style={{ margin: "0.75rem 0 0", color: "var(--color-danger)", fontSize: "0.85rem" }}>
          {error}
        </p>
      )}
      <p style={{ margin: "0.75rem 0 0", fontSize: "0.83rem", color: "var(--color-ink-faint)" }}>
        These orders will be shown together and can be moved through the stages in one click.
      </p>
    </Dialog>
  );
}
