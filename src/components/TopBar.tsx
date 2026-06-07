"use client";

// The bar above the card: title, global search, theme toggle, Audit Log, sign out.
import GlobalSearch from "./GlobalSearch";
import ThemeToggle from "./ThemeToggle";
import { APP_TITLE } from "@/lib/config";
import type { Batch, Order } from "@/lib/types";

export default function TopBar({
  orders,
  batchesByOrder,
  onJump,
  onOpenAudit,
}: {
  orders: Order[];
  batchesByOrder: Record<string, Batch[]>;
  onJump: (o: Order) => void;
  onOpenAudit: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
        marginBottom: "1.25rem",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "1.25rem", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
        {APP_TITLE}
      </h1>

      <GlobalSearch orders={orders} batchesByOrder={batchesByOrder} onJump={onJump} />

      <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
        <ThemeToggle />
        <button className="btn btn-outline btn-md" onClick={onOpenAudit}>
          Audit Log
        </button>
        {/* Sign out posts to a tiny server route that clears the session. */}
        <form action="/auth/signout" method="post">
          <button className="btn btn-ghost btn-md" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
