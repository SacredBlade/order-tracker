"use client";

// Generic "are you sure?" dialog used for delete + reopen confirmation.
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
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn-outline btn-md" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn btn-md ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, color: "var(--color-ink-soft)", lineHeight: 1.55 }}>{message}</p>
    </Dialog>
  );
}
