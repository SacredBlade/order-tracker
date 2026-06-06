"use client";

// Top-bar search across ALL stages (including Completed) by order number,
// customer, and destination. Click a result to jump to that order.
import { useEffect, useMemo, useRef, useState } from "react";
import StageBadge from "./ui/StageBadge";
import type { Order } from "@/lib/types";

export default function GlobalSearch({
  orders,
  onJump,
}: {
  orders: Order[];
  onJump: (order: Order) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return orders
      .filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.destination.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [orders, query]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={boxRef} style={{ position: "relative", flex: "1 1 280px", maxWidth: 460 }}>
      <input
        className="input"
        placeholder="Search all orders…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        aria-label="Search all orders"
      />

      {open && query.trim() !== "" && (
        <div
          className="animate-pop"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 30,
            background: "var(--color-card)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-box)",
            boxShadow: "var(--shadow-pop)",
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {results.length === 0 ? (
            <p style={{ padding: "0.9rem", margin: 0, color: "var(--color-ink-faint)", fontSize: "0.9rem" }}>
              No matches.
            </p>
          ) : (
            results.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  onJump(o);
                  setOpen(false);
                  setQuery("");
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--color-line)",
                  padding: "0.7rem 0.85rem",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-sunken)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {o.order_number}
                  </span>
                  <StageBadge stage={o.stage} />
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--color-ink-soft)", marginTop: "0.2rem" }}>
                  {o.customer || "—"} · {o.destination || "—"}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
