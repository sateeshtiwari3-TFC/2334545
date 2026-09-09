import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fallback values or environment variables
const DEFAULT_SUPABASE_URL = 'https://ezmetpeqwnxfxbxpjdr.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bWV0cGVxd254ZnhieGpwamRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MjQ3NTMsImV4cCI6MjEwNDUwMDc1M30.0t5RY2LEQjlWscRHAG_JdkwadhlL4bIyCTOQMB9zEu8';
export const SUPABASE_STORAGE_BUCKET = 'theframecut-media';

const metaEnv = (import.meta as any).env;
const supabaseUrl = (metaEnv?.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (metaEnv?.VITE_SUPABASE_KEY) || DEFAULT_SUPABASE_KEY;

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
}

export const supabase = getSupabaseClient();
