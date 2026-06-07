"use client";

// The heart of the app. Loads everything from Supabase, keeps it in sync with
// realtime, and wires up all the actions. Every action saves to Supabase
// immediately, then the UI refreshes from the database.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createOrder,
  deleteOrder,
  fetchAll,
  moveOrderForward,
  reopenOrder,
  saveBatches,
  updateOrder,
} from "@/lib/db";
import { type StageNumber } from "@/lib/config";
import type { AuditEntry, Batch, DraftBatch, Order } from "@/lib/types";

import TopBar from "./TopBar";
import Tabs from "./Tabs";
import OrderCard from "./OrderCard";
import AddEditOrderDialog from "./AddEditOrderDialog";
import BatchesDialog from "./BatchesDialog";
import ReopenDialog from "./ReopenDialog";
import ConfirmDialog from "./ConfirmDialog";
import AuditLogPanel from "./AuditLogPanel";

type DialogState =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit"; order: Order }
  | { type: "batches"; order: Order }
  | { type: "reopen"; order: Order }
  | { type: "confirmDelete"; order: Order }
  | { type: "audit" };

export default function AppShell({ userEmail }: { userEmail: string }) {
  const supabase = useMemo(() => createClient(), []);

  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<StageNumber>(1);
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // ---- load + realtime ------------------------------------------------------
  const reload = useCallback(async () => {
    try {
      const { orders, batches } = await fetchAll(supabase);
      setOrders(orders);
      setBatches(batches);
      const { data } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      setAudit((data ?? []) as AuditEntry[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load data.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    reload();

    // Realtime: any change to these tables triggers a refresh.
    const channel = supabase
      .channel("order-tracker")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "batches" }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_log" }, () => reload())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, reload]);

  // Tick the clock each minute so "time in stage" + stuck flags stay current.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ---- derived --------------------------------------------------------------
  const counts = useMemo(() => {
    const c: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const o of orders) c[o.stage] = (c[o.stage] ?? 0) + 1;
    return c;
  }, [orders]);

  const batchesByOrder = useMemo(() => {
    const map: Record<string, Batch[]> = {};
    for (const b of batches) (map[b.order_id] ??= []).push(b);
    return map;
  }, [batches]);

  const visibleOrders = useMemo(() => orders.filter((o) => o.stage === tab), [orders, tab]);

  // ---- action wrapper -------------------------------------------------------
  // Runs an action, then reloads. Realtime also reloads, but reloading here
  // makes the change feel instant for the person who clicked.
  async function run(fn: () => Promise<void>) {
    try {
      setError(null);
      await fn();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  // ---- handlers -------------------------------------------------------------
  function onMove(order: Order) {
    if (order.stage === 2) {
      // Stage 2 -> 3 first asks for batches.
      setDialog({ type: "batches", order });
    } else {
      run(() => moveOrderForward(supabase, order));
    }
  }

  function jumpTo(order: Order) {
    setTab(order.stage as StageNumber);
    setHighlightId(order.id);
    window.setTimeout(() => setHighlightId(null), 2500);
  }

  // ---- render ---------------------------------------------------------------
  return (
    <main style={{ minHeight: "100dvh", padding: "1.5rem 1rem 4rem" }}>
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          background: "var(--color-card)",
          border: "1px solid var(--color-line)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-card)",
          padding: "1.5rem",
        }}
      >
        <TopBar
          orders={orders}
          batchesByOrder={batchesByOrder}
          onJump={jumpTo}
          onOpenAudit={() => setDialog({ type: "audit" })}
        />

        {error && (
          <div
            role="alert"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
              fontSize: "0.85rem",
              color: "var(--color-danger)",
              background: "var(--color-danger-soft)",
              border: "1px solid color-mix(in oklch, var(--color-danger) 25%, transparent)",
              borderRadius: "var(--radius-box)",
              padding: "0.65rem 0.85rem",
            }}
          >
            <span>{error}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <button className="btn btn-primary btn-lg" onClick={() => setDialog({ type: "add" })}>
            + Add Order
          </button>
        </div>

        <Tabs active={tab} counts={counts} onChange={setTab} />

        {/* List */}
        {loading ? (
          <SkeletonList />
        ) : visibleOrders.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div style={{ display: "grid", gap: "0.85rem" }}>
            {visibleOrders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                batches={batchesByOrder[o.id] ?? []}
                now={now}
                highlight={highlightId === o.id}
                onMove={() => onMove(o)}
                onEdit={() => setDialog({ type: "edit", order: o })}
                onDelete={() => setDialog({ type: "confirmDelete", order: o })}
                onReopen={() => setDialog({ type: "reopen", order: o })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ---- Dialogs ---- */}
      {dialog.type === "add" && (
        <AddEditOrderDialog
          mode="add"
          onCancel={() => setDialog({ type: "none" })}
          onSave={async (fields) => {
            await run(async () => {
              await createOrder(supabase, fields);
            });
            setTab(1);
            setDialog({ type: "none" });
          }}
        />
      )}

      {dialog.type === "edit" && (
        <AddEditOrderDialog
          mode="edit"
          order={dialog.order}
          existingBatches={batchesByOrder[dialog.order.id] ?? []}
          onCancel={() => setDialog({ type: "none" })}
          onSave={async (fields, draftBatches) => {
            const order = dialog.order;
            await run(async () => {
              await updateOrder(supabase, order, fields);
              if (draftBatches) await saveBatches(supabase, { ...order, ...fields }, draftBatches);
            });
            setDialog({ type: "none" });
          }}
        />
      )}

      {dialog.type === "batches" && (
        <BatchesDialog
          order={dialog.order}
          onCancel={() => setDialog({ type: "none" })}
          onConfirm={(draftBatches: DraftBatch[]) => {
            const order = dialog.order;
            run(() => moveOrderForward(supabase, order, draftBatches)).then(() =>
              setDialog({ type: "none" })
            );
          }}
        />
      )}

      {dialog.type === "reopen" && (
        <ReopenDialog
          order={dialog.order}
          onCancel={() => setDialog({ type: "none" })}
          onConfirm={(stage) => {
            const order = dialog.order;
            run(() => reopenOrder(supabase, order, stage)).then(() => {
              setTab(stage as StageNumber);
              setDialog({ type: "none" });
            });
          }}
        />
      )}

      {dialog.type === "confirmDelete" && (
        <ConfirmDialog
          title="Delete order?"
          danger
          confirmLabel="Delete"
          message={
            <>
              This permanently deletes order{" "}
              <span className="mono" style={{ color: "var(--color-ink)" }}>
                {dialog.order.order_number}
              </span>{" "}
              and its batches. The audit log keeps a record. This cannot be undone.
            </>
          }
          onCancel={() => setDialog({ type: "none" })}
          onConfirm={() => {
            const order = dialog.order;
            run(() => deleteOrder(supabase, order)).then(() => setDialog({ type: "none" }));
          }}
        />
      )}

      {dialog.type === "audit" && (
        <AuditLogPanel entries={audit} onClose={() => setDialog({ type: "none" })} />
      )}
    </main>
  );
}

// ---- small inline helpers ---------------------------------------------------
function EmptyState({ tab }: { tab: StageNumber }) {
  const msg =
    tab === 4
      ? "No completed orders yet."
      : tab === 1
        ? "No orders here. Click “Add Order” to create one."
        : "Nothing in this stage right now.";
  return (
    <div
      style={{
        textAlign: "center",
        color: "var(--color-ink-faint)",
        padding: "3rem 1rem",
        border: "1px dashed var(--color-line-strong)",
        borderRadius: "var(--radius-box)",
      }}
    >
      {msg}
    </div>
  );
}

function SkeletonList() {
  return (
    <div style={{ display: "grid", gap: "0.85rem" }} aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            height: 110,
            borderRadius: "var(--radius-box)",
            border: "1px solid var(--color-line)",
            background:
              "linear-gradient(90deg, var(--color-sunken) 25%, var(--color-card) 50%, var(--color-sunken) 75%)",
            backgroundSize: "200% 100%",
            animation: "fade-in 0.3s ease",
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
}
