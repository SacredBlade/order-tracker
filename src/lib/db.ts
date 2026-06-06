// All database writes live here so that EVERY action also writes an audit-log
// row consistently. Each function talks to Supabase directly, so changes save
// immediately on click. Realtime then pushes the change to any open page.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Batch, DraftBatch, Order } from "./types";

type SB = SupabaseClient;

// ---- audit ------------------------------------------------------------------
async function logAudit(
  supabase: SB,
  entry: { order_id: string | null; order_number: string; action: string; detail: string }
) {
  await supabase.from("audit_log").insert(entry);
}

// ---- create -----------------------------------------------------------------
export async function createOrder(
  supabase: SB,
  fields: { order_number: string; customer: string; destination: string; notes: string }
): Promise<Order> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      order_number: fields.order_number,
      customer: fields.customer,
      destination: fields.destination,
      notes: fields.notes,
      stage: 1,
      created_at: now,
      stage_entered_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw error;

  await logAudit(supabase, {
    order_id: data.id,
    order_number: data.order_number,
    action: "created",
    detail: `Order created in stage 1`,
  });
  return data as Order;
}

// ---- move forward -----------------------------------------------------------
// 1 -> 2, 2 -> 3, 3 -> 4 (completed). For 2 -> 3, batches are saved first.
export async function moveOrderForward(
  supabase: SB,
  order: Order,
  batches?: DraftBatch[]
): Promise<void> {
  const nextStage = order.stage + 1;
  const now = new Date().toISOString();

  if (batches && batches.length > 0) {
    await saveBatches(supabase, order, batches, /* silent */ true);
  }

  const patch: Partial<Order> = {
    stage: nextStage,
    stage_entered_at: now,
    updated_at: now,
  };
  if (nextStage === 4) patch.completed_at = now;

  const { error } = await supabase.from("orders").update(patch).eq("id", order.id);
  if (error) throw error;

  const label = nextStage === 4 ? "Completed" : `stage ${nextStage}`;
  await logAudit(supabase, {
    order_id: order.id,
    order_number: order.order_number,
    action: "moved",
    detail: `Moved from stage ${order.stage} to ${label}`,
  });
}

// ---- reopen -----------------------------------------------------------------
export async function reopenOrder(supabase: SB, order: Order, toStage: number): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("orders")
    .update({ stage: toStage, stage_entered_at: now, completed_at: null, updated_at: now })
    .eq("id", order.id);
  if (error) throw error;

  await logAudit(supabase, {
    order_id: order.id,
    order_number: order.order_number,
    action: "reopened",
    detail: `Reopened from Completed to stage ${toStage}`,
  });
}

// ---- edit -------------------------------------------------------------------
export async function updateOrder(
  supabase: SB,
  order: Order,
  next: { order_number: string; customer: string; destination: string; notes: string }
): Promise<void> {
  // Build a human-readable list of what changed, for the audit log.
  const changes: string[] = [];
  if (next.order_number !== order.order_number)
    changes.push(`order number "${order.order_number}" → "${next.order_number}"`);
  if (next.customer !== order.customer)
    changes.push(`customer "${order.customer || "—"}" → "${next.customer || "—"}"`);
  if (next.destination !== order.destination)
    changes.push(`destination "${order.destination || "—"}" → "${next.destination || "—"}"`);

  const notesChanged = next.notes !== order.notes;

  if (changes.length === 0 && !notesChanged) return; // nothing changed

  const { error } = await supabase
    .from("orders")
    .update({ ...next, updated_at: new Date().toISOString() })
    .eq("id", order.id);
  if (error) throw error;

  if (changes.length > 0) {
    await logAudit(supabase, {
      order_id: order.id,
      order_number: next.order_number,
      action: "edited",
      detail: changes.join("; "),
    });
  }
  if (notesChanged) {
    await logAudit(supabase, {
      order_id: order.id,
      order_number: next.order_number,
      action: "notes_edited",
      detail: `Notes updated`,
    });
  }
}

// ---- batches ----------------------------------------------------------------
// Replaces the order's batches with the supplied list (used by edit + move 2->3).
export async function saveBatches(
  supabase: SB,
  order: Order,
  drafts: DraftBatch[],
  silent = false
): Promise<void> {
  // Clear existing, then insert the current set. Simple + reliable.
  await supabase.from("batches").delete().eq("order_id", order.id);

  const rows = drafts
    .filter((d) => d.code.trim() !== "" || d.product.trim() !== "")
    .map((d) => ({
      order_id: order.id,
      code: d.code.trim(),
      product: d.product.trim(),
      packaging: d.packaging.trim(),
      quantity: Number(d.quantity) || 0,
    }));

  if (rows.length > 0) {
    const { error } = await supabase.from("batches").insert(rows);
    if (error) throw error;
  }

  if (!silent) {
    await logAudit(supabase, {
      order_id: order.id,
      order_number: order.order_number,
      action: "batches_added",
      detail:
        rows.length === 0
          ? "Batches cleared"
          : `Batches set: ${rows.map((r) => `${r.code || r.product} ×${r.quantity}`).join(", ")}`,
    });
  } else {
    await logAudit(supabase, {
      order_id: order.id,
      order_number: order.order_number,
      action: "batches_added",
      detail: `${rows.length} batch${rows.length === 1 ? "" : "es"} recorded at pickup booking`,
    });
  }
}

// ---- delete -----------------------------------------------------------------
export async function deleteOrder(supabase: SB, order: Order): Promise<void> {
  // Log BEFORE deleting (order_id will be set to null by the DB afterwards).
  await logAudit(supabase, {
    order_id: order.id,
    order_number: order.order_number,
    action: "deleted",
    detail: `Order deleted (was in ${order.stage === 4 ? "Completed" : `stage ${order.stage}`})`,
  });
  const { error } = await supabase.from("orders").delete().eq("id", order.id);
  if (error) throw error;
}

// ---- reads ------------------------------------------------------------------
export async function fetchAll(supabase: SB): Promise<{ orders: Order[]; batches: Batch[] }> {
  const [ordersRes, batchesRes] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("batches").select("*").order("created_at", { ascending: true }),
  ]);
  if (ordersRes.error) throw ordersRes.error;
  if (batchesRes.error) throw batchesRes.error;
  return { orders: (ordersRes.data ?? []) as Order[], batches: (batchesRes.data ?? []) as Batch[] };
}
