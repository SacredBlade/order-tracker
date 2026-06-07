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
  groupOrders,
  moveOrderForward,
  reopenOrder,
  saveBatches,
  ungroupOrders,
  updateOrder,
} from "@/lib/db";
import { STAGES, type StageNumber } from "@/lib/config";
import type { AuditEntry, Batch, DraftBatch, Order } from "@/lib/types";

import TopBar from "./TopBar";
import Tabs from "./Tabs";
import OrderCard from "./OrderCard";
import AddEditOrderDialog from "./AddEditOrderDialog";
import BatchesDialog from "./BatchesDialog";
import ReopenDialog from "./ReopenDialog";
import ConfirmDialog from "./ConfirmDialog";
import AuditLogPanel from "./AuditLogPanel";
import GroupNameDialog from "./GroupNameDialog";

type DialogState =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit"; order: Order }
  | { type: "batches"; orders: Order[] } // one order, or a whole group
  | { type: "reopen"; order: Order }
  | { type: "confirmDelete"; order: Order }
  | { type: "groupName"; orders: Order[] }
  | { type: "confirmMoveGroup"; orders: Order[]; label: string }
  | { type: "audit" };

// A row in the list is either one order or a group of orders.
type Block =
  | { kind: "single"; order: Order }
  | { kind: "group"; groupId: string; name: string | null; orders: Order[] };

// Pulls a readable message out of either a JS Error or a Supabase error object.
function errText(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const o = e as { message?: string; details?: string; hint?: string };
    return o.message || o.details || o.hint || fallback;
  }
  return fallback;
}

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

  // Select mode (for grouping): which orders are ticked.
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
      setError(errText(e, "Could not load data."));
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

  // Turn the visible orders into rows: grouped orders cluster into one block.
  const blocks = useMemo(() => {
    const out: Block[] = [];
    const groupBlock: Record<string, Extract<Block, { kind: "group" }>> = {};
    for (const o of visibleOrders) {
      if (o.group_id) {
        let b = groupBlock[o.group_id];
        if (!b) {
          b = { kind: "group", groupId: o.group_id, name: o.group_name, orders: [] };
          groupBlock[o.group_id] = b;
          out.push(b);
        }
        b.orders.push(o);
      } else {
        out.push({ kind: "single", order: o });
      }
    }
    return out;
  }, [visibleOrders]);

  // ---- action wrapper -------------------------------------------------------
  // Runs an action, then reloads. Realtime also reloads, but reloading here
  // makes the change feel instant for the person who clicked.
  async function run(fn: () => Promise<void>) {
    try {
      setError(null);
      await fn();
      await reload();
    } catch (e) {
      setError(errText(e, "Something went wrong."));
    }
  }

  // ---- handlers -------------------------------------------------------------
  function onMove(order: Order) {
    if (order.stage === 2) {
      // Stage 2 -> 3 first asks for batches.
      setDialog({ type: "batches", orders: [order] });
    } else {
      run(() => moveOrderForward(supabase, order));
    }
  }

  // Move every order in a group that is currently in the given stage.
  function onMoveGroup(members: Order[], stage: number) {
    if (members.length === 0) return;
    if (stage === 2) {
      setDialog({ type: "batches", orders: members });
    } else {
      const label = STAGES[stage as StageNumber]?.moveButton ?? "Move";
      setDialog({ type: "confirmMoveGroup", orders: members, label });
    }
  }

  // ---- selection / grouping -------------------------------------------------
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelect() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function jumpTo(order: Order) {
    setTab(order.stage as StageNumber);
    setHighlightId(order.id);
    window.setTimeout(() => setHighlightId(null), 2500);
  }

  const selectedOrders = visibleOrders.filter((o) => selectedIds.has(o.id));

  // Renders one order card with all its handlers wired up.
  function renderCard(o: Order, inGroup: boolean) {
    return (
      <OrderCard
        key={o.id}
        order={o}
        batches={batchesByOrder[o.id] ?? []}
        now={now}
        highlight={highlightId === o.id}
        inGroup={inGroup}
        selectable={selectMode}
        selected={selectedIds.has(o.id)}
        onToggleSelect={() => toggleSelect(o.id)}
        onMove={() => onMove(o)}
        onEdit={() => setDialog({ type: "edit", order: o })}
        onDelete={() => setDialog({ type: "confirmDelete", order: o })}
        onReopen={() => setDialog({ type: "reopen", order: o })}
      />
    );
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

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          {selectMode ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                className="btn btn-primary btn-md"
                disabled={selectedIds.size < 2}
                onClick={() => setDialog({ type: "groupName", orders: selectedOrders })}
              >
                Group together ({selectedIds.size})
              </button>
              <button className="btn btn-ghost btn-md" onClick={exitSelect}>
                Cancel
              </button>
              <span style={{ fontSize: "0.83rem", color: "var(--color-ink-faint)" }}>
                Tick the orders that ship together.
              </span>
            </div>
          ) : (
            <button className="btn btn-outline btn-md" onClick={() => setSelectMode(true)}>
              Select / group
            </button>
          )}

          {!selectMode && (
            <button className="btn btn-primary btn-lg" onClick={() => setDialog({ type: "add" })}>
              + Add Order
            </button>
          )}
        </div>

        <Tabs
          active={tab}
          counts={counts}
          onChange={(s) => {
            setTab(s);
            setSelectedIds(new Set());
          }}
        />

        {/* List */}
        {loading ? (
          <SkeletonList />
        ) : visibleOrders.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div style={{ display: "grid", gap: "0.85rem" }}>
            {blocks.map((block) =>
              block.kind === "single" ? (
                renderCard(block.order, false)
              ) : (
                <GroupBlock
                  key={block.groupId}
                  block={block}
                  stage={tab}
                  onMoveGroup={() => onMoveGroup(block.orders, tab)}
                  onUngroup={() =>
                    run(() => ungroupOrders(supabase, block.groupId, block.orders))
                  }
                  renderCard={renderCard}
                />
              )
            )}
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
          orders={dialog.orders}
          onCancel={() => setDialog({ type: "none" })}
          onConfirm={(batchesByOrder: Record<string, DraftBatch[]>) => {
            const members = dialog.orders;
            run(async () => {
              for (const o of members) {
                await moveOrderForward(supabase, o, batchesByOrder[o.id]);
              }
            }).then(() => setDialog({ type: "none" }));
          }}
        />
      )}

      {dialog.type === "groupName" && (
        <GroupNameDialog
          count={dialog.orders.length}
          onCancel={() => setDialog({ type: "none" })}
          onConfirm={(name) => {
            const sel = dialog.orders;
            run(() => groupOrders(supabase, sel, name)).then(() => {
              setDialog({ type: "none" });
              exitSelect();
            });
          }}
        />
      )}

      {dialog.type === "confirmMoveGroup" && (
        <ConfirmDialog
          title="Move whole group?"
          confirmLabel="Move all"
          message={
            <>
              This moves all {dialog.orders.length} orders in this group to the next stage.
            </>
          }
          onCancel={() => setDialog({ type: "none" })}
          onConfirm={() => {
            const members = dialog.orders;
            run(async () => {
              for (const o of members) {
                await moveOrderForward(supabase, o);
              }
            }).then(() => setDialog({ type: "none" }));
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

// A group of orders that ship together. Shows a header with the group name,
// a single "move" button that advances every order in the group, and Ungroup.
function GroupBlock({
  block,
  stage,
  onMoveGroup,
  onUngroup,
  renderCard,
}: {
  block: { kind: "group"; groupId: string; name: string | null; orders: Order[] };
  stage: StageNumber;
  onMoveGroup: () => void;
  onUngroup: () => void;
  renderCard: (o: Order, inGroup: boolean) => React.ReactNode;
}) {
  const moveLabel = STAGES[stage]?.moveButton;
  const isActive = stage >= 1 && stage <= 3;

  return (
    <div
      style={{
        border: "1px solid var(--color-line-strong)",
        borderRadius: "var(--radius-box)",
        background: "var(--color-sunken)",
        padding: "0.85rem",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          marginBottom: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--color-accent)" }}
          />
          <strong style={{ fontSize: "0.95rem" }}>{block.name || "Group"}</strong>
          <span style={{ fontSize: "0.82rem", color: "var(--color-ink-faint)" }}>
            · {block.orders.length} orders
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {isActive && moveLabel && (
            <button
              className={`btn btn-md ${stage === 3 ? "btn-go" : "btn-primary"}`}
              onClick={onMoveGroup}
            >
              {moveLabel}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onUngroup}>
            Ungroup
          </button>
        </div>
      </header>

      <div style={{ display: "grid", gap: "0.6rem" }}>
        {block.orders.map((o) => renderCard(o, true))}
      </div>
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
