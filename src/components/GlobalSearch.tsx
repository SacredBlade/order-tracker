"use client";

// Top-bar search across ALL stages (including Completed) by order number,
// customer, destination, AND batch code / product / packaging.
// Click a result to jump to that order.
import { useEffect, useMemo, useRef, useState } from "react";
import StageBadge from "./ui/StageBadge";
import type { Batch, Order } from "@/lib/types";

export default function GlobalSearch({
  orders,
  batchesByOrder,
  onJump,
}: {
  orders: Order[];
  batchesByOrder: Record<string, Batch[]>;
  onJump: (order: Order) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Each result is an order, plus (if it only matched on a batch) a short note
  // saying which batch matched, so it's clear why it showed up.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: { order: Order; batchMatch?: string }[] = [];
    for (const o of orders) {
      const inOrder =
        o.order_number.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.destination.toLowerCase().includes(q);

      const batches = batchesByOrder[o.id] ?? [];
      const matchedBatch = batches.find(
        (b) =>
          b.code.toLowerCase().includes(q) ||
          b.product.toLowerCase().includes(q) ||
          b.packaging.toLowerCase().includes(q)
      );

      if (inOrder || matchedBatch) {
        out.push({
          order: o,
          batchMatch: !inOrder && matchedBatch ? matchedBatch.code || matchedBatch.product : undefined,
        });
      }
      if (out.length >= 12) break;
    }
    return out;
  }, [orders, batchesByOrder, query]);

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
        placeholder="Search orders & batches…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        aria-label="Search orders and batches"
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
            results.map(({ order: o, batchMatch }) => (
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
                {batchMatch && (
                  <div style={{ fontSize: "0.78rem", color: "var(--color-ink-faint)", marginTop: "0.15rem" }}>
                    matches batch <span className="mono">{batchMatch}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
