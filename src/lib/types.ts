// Shared TypeScript types that mirror the database tables.

export type Order = {
  id: string;
  order_number: string;
  customer: string;
  destination: string;
  notes: string;
  stage: number; // 1,2,3 active; 4 completed
  created_at: string;
  stage_entered_at: string;
  completed_at: string | null;
  updated_at: string;
};

export type Batch = {
  id: string;
  order_id: string;
  code: string;
  product: string;
  packaging: string;
  quantity: number;
  created_at: string;
};

export type AuditEntry = {
  id: string;
  order_id: string | null;
  order_number: string;
  action: string;
  detail: string;
  created_at: string;
};

// A batch being typed in the dialog before it is saved.
export type DraftBatch = {
  key: string; // local-only id for React keys
  code: string;
  product: string;
  packaging: string;
  quantity: string; // kept as string while typing
};
