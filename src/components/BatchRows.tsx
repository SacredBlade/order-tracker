"use client";

// The editable list of batches. Used both in the "Book for Pickup" dialog and
// when editing an order. As you type a code, it detects the prefix and shows
// the right packaging options (see src/lib/config.ts to change the rules).
import { parseBatchCode } from "@/lib/batchParser";
import type { DraftBatch } from "@/lib/types";

let counter = 0;
export function blankBatch(): DraftBatch {
  counter += 1;
  return { key: `b${Date.now()}_${counter}`, code: "", product: "", packaging: "", quantity: "1" };
}

export default function BatchRows({
  rows,
  setRows,
}: {
  rows: DraftBatch[];
  setRows: (rows: DraftBatch[]) => void;
}) {
  function patch(key: string, changes: Partial<DraftBatch>) {
    setRows(rows.map((r) => (r.key === key ? { ...r, ...changes } : r)));
  }

  // When the code changes we re-detect the prefix and reset stale selections.
  function onCodeChange(row: DraftBatch, code: string) {
    const parsed = parseBatchCode(code);
    let product = row.product;
    let packaging = row.packaging;

    if (parsed.status === "simple") {
      product = parsed.product;
      if (!parsed.packaging.includes(packaging)) packaging = "";
    } else if (parsed.status === "chooser") {
      const valid = parsed.products.some((p) => p.product === product);
      if (!valid) {
        product = "";
        packaging = "";
      }
    }
    patch(row.key, { code, product, packaging });
  }

  function removeRow(key: string) {
    setRows(rows.filter((r) => r.key !== key));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {rows.map((row, i) => {
        const parsed = parseBatchCode(row.code);
        return (
          <div
            key={row.key}
            style={{
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-box)",
              padding: "0.85rem",
              background: "var(--color-sunken)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.6rem",
              }}
            >
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-ink-soft)" }}>
                Batch {i + 1}
              </span>
              {rows.length > 1 && (
                <button
                  className="btn btn-danger-ghost btn-sm"
                  onClick={() => removeRow(row.key)}
                  type="button"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Code */}
            <label className="field-label">Batch code</label>
            <input
              className="input mono"
              placeholder="e.g. XP1234B"
              value={row.code}
              onChange={(e) => onCodeChange(row, e.target.value)}
              style={{ textTransform: "uppercase" }}
            />

            {/* What we detected from the code */}
            <div style={{ marginTop: "0.6rem" }}>
              {/* SIMPLE prefix: product is known, just pick packaging */}
              {parsed.status === "simple" && (
                <ProductLine product={parsed.product}>
                  <PackagingSelect
                    options={parsed.packaging}
                    value={row.packaging}
                    onChange={(v) => patch(row.key, { packaging: v })}
                  />
                </ProductLine>
              )}

              {/* CHOOSER prefix (e.g. IM): pick the product, then packaging */}
              {parsed.status === "chooser" && (
                <div style={{ display: "grid", gap: "0.6rem" }}>
                  <div>
                    <label className="field-label">
                      Product (prefix {parsed.prefix} is shared, pick one)
                    </label>
                    <select
                      className="select"
                      value={row.product}
                      onChange={(e) => patch(row.key, { product: e.target.value, packaging: "" })}
                    >
                      <option value="">Choose product…</option>
                      {parsed.products.map((p) => (
                        <option key={p.product} value={p.product}>
                          {p.product}
                        </option>
                      ))}
                    </select>
                  </div>
                  {row.product && (
                    <div>
                      <label className="field-label">Packaging</label>
                      <PackagingSelect
                        options={
                          parsed.products.find((p) => p.product === row.product)?.packaging ?? []
                        }
                        value={row.packaging}
                        onChange={(v) => patch(row.key, { packaging: v })}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* UNKNOWN prefix: let the user type product + packaging by hand */}
              {parsed.status === "unknown" && (
                <ManualEntry
                  hint={`Prefix "${parsed.prefix}" isn't in the list — type product & packaging.`}
                  product={row.product}
                  packaging={row.packaging}
                  onProduct={(v) => patch(row.key, { product: v })}
                  onPackaging={(v) => patch(row.key, { packaging: v })}
                />
              )}

              {/* Not a complete code yet */}
              {parsed.status === "invalid" && row.code.trim() !== "" && (
                <p style={{ margin: "0.1rem 0 0", fontSize: "0.8rem", color: "var(--color-ink-faint)" }}>
                  Format: letters + 4 digits + “B” (e.g. XP1234B).
                </p>
              )}
            </div>

            {/* Quantity */}
            <div style={{ marginTop: "0.6rem", maxWidth: 160 }}>
              <label className="field-label">Quantity</label>
              <input
                className="input tabular"
                type="number"
                min="0"
                step="1"
                value={row.quantity}
                onChange={(e) => patch(row.key, { quantity: e.target.value })}
              />
            </div>
          </div>
        );
      })}

      <button
        type="button"
        className="btn btn-outline btn-md"
        onClick={() => setRows([...rows, blankBatch()])}
        style={{ alignSelf: "flex-start" }}
      >
        + Add another batch
      </button>
    </div>
  );
}

function ProductLine({ product, children }: { product: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: "0.6rem" }}>
      <div style={{ fontSize: "0.85rem", color: "var(--color-ink-soft)" }}>
        Product: <strong style={{ color: "var(--color-ink)" }}>{product}</strong>
      </div>
      <div>
        <label className="field-label">Packaging</label>
        {children}
      </div>
    </div>
  );
}

function PackagingSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Choose packaging…</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function ManualEntry({
  hint,
  product,
  packaging,
  onProduct,
  onPackaging,
}: {
  hint: string;
  product: string;
  packaging: string;
  onProduct: (v: string) => void;
  onPackaging: (v: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: "0.6rem" }}>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-warn-ink)" }}>{hint}</p>
      <div>
        <label className="field-label">Product</label>
        <input className="input" value={product} onChange={(e) => onProduct(e.target.value)} />
      </div>
      <div>
        <label className="field-label">Packaging</label>
        <input className="input" value={packaging} onChange={(e) => onPackaging(e.target.value)} />
      </div>
    </div>
  );
}
