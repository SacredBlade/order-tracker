"use client";

// Generic "are you sure?" dialog used for delete + reopen confirmation.
import { useState } from "react";
import Dialog from "./ui/Dialog";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <Dialog
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn-outline btn-md" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            className={`btn btn-md ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={confirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, color: "var(--color-ink-soft)", lineHeight: 1.55 }}>{message}</p>
      {error && (
        <p style={{ margin: "0.75rem 0 0", color: "var(--color-danger)", fontSize: "0.85rem" }}>
          {error}
        </p>
      )}
    </Dialog>
  );
}
