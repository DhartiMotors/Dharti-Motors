if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase) {
  window.SB = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}
