"use client";

// A simple, reliable modal dialog: dimmed backdrop, centered panel, closes on
// Escape or backdrop click, locks background scroll, and traps initial focus.
import { useEffect, useRef } from "react";

export default function Dialog({
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // lock scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // focus first focusable element
    panelRef.current?.querySelector<HTMLElement>(
      "input, textarea, select, button"
    )?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="animate-fade"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "oklch(0.2 0.02 60 / 0.38)",
        display: "grid",
        placeItems: "center",
        padding: "1.25rem",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={panelRef}
        className="animate-pop"
        style={{
          width: "100%",
          maxWidth: wide ? 640 : 460,
          maxHeight: "calc(100dvh - 2.5rem)",
          display: "flex",
          flexDirection: "column",
          background: "var(--color-card)",
          border: "1px solid var(--color-line)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-pop)",
          overflow: "hidden",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.1rem 1.25rem",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>{title}</h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close"
            style={{ marginRight: "-0.35rem" }}
          >
            ✕
          </button>
        </header>

        <div style={{ padding: "1.25rem", overflowY: "auto" }}>{children}</div>

        {footer && (
          <footer
            style={{
              display: "flex",
              gap: "0.6rem",
              justifyContent: "flex-end",
              padding: "1rem 1.25rem",
              borderTop: "1px solid var(--color-line)",
              background: "var(--color-sunken)",
            }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
