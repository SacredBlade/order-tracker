// Browser-side Supabase client. Used by the app for all reads, writes, and
// realtime. The anon key is meant to be public; your data is protected by
// Row Level Security + the login.
"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
