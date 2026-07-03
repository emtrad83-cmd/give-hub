import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const looksRealSupabaseUrl =
  typeof supabaseUrl === "string" &&
  supabaseUrl.startsWith("https://") &&
  supabaseUrl.includes(".supabase.co") &&
  !supabaseUrl.includes("example.supabase.co");

const looksRealAnonKey =
  typeof supabaseAnonKey === "string" &&
  supabaseAnonKey.length > 30 &&
  supabaseAnonKey !== "preview-key";

export const hasSupabaseConfig = Boolean(looksRealSupabaseUrl && looksRealAnonKey);
export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null;
