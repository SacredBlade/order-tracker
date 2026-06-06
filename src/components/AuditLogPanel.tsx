"use client";

// The Audit Log view (opened from the top-right button). Newest first, with a
// box to filter by order number.
import { useMemo, useState } from "react";
import Dialog from "./ui/Dialog";
import { formatDateTime } from "@/lib/time";
import type { AuditEntry } from "@/lib/types";

const ACTION_LABEL: Record<string, string> = {
  created: "Created",
  moved: "Moved",
  edited: "Edited",
  notes_edited: "Notes",
  batches_added: "Batches",
  deleted: "Deleted",
  reopened: "Reopened",
};

export default function AuditLogPanel({
  entries,
  onClose,
}: {
  entries: AuditEntry[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.order_number.toLowerCase().includes(q));
  }, [entries, query]);

  return (
    <Dialog title="Audit log" onClose={onClose} wide>
      <input
        className="input"
        placeholder="Filter by order number…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: "1rem" }}
      />

      {filtered.length === 0 ? (
        <p style={{ color: "var(--color-ink-faint)", textAlign: "center", padding: "2rem 0" }}>
          {entries.length === 0 ? "No activity yet." : "No entries match that order number."}
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.5rem" }}>
          {filtered.map((e) => (
            <li
              key={e.id}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "0.75rem",
                padding: "0.7rem 0.85rem",
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-box)",
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  color: "var(--color-accent)",
                  alignSelf: "center",
                  minWidth: 64,
                }}
              >
                {ACTION_LABEL[e.action] ?? e.action}
              </span>
              <div>
                <div style={{ fontSize: "0.9rem" }}>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {e.order_number || "—"}
                  </span>{" "}
                  <span style={{ color: "var(--color-ink-soft)" }}>{e.detail}</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--color-ink-faint)", marginTop: "0.15rem" }}>
                  {formatDateTime(e.created_at)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
