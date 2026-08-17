/* Live presence, first-party.
   The scraped numbers say what each site claims. This says who is actually
   here — measured by us, in real time.

   A visitor sends an anonymous heartbeat every 20s while the tab is visible.
   "Here now" is distinct visitors seen in the last 45s. No accounts, no
   cookies, no personal data — just a random id kept in localStorage.

   The key below is Supabase's publishable key. It is meant to be public: row
   level security denies all direct table access, and the only things it can
   call are heartbeat() and live_counts(), which return aggregates. */
window.PRESENCE = {
  url: 'https://iomcpnyfnuvujgzamtbp.supabase.co',
  key: 'sb_publishable_ahLqxPOO8qFkYgQIJAQW6g_5CbDAdb5',
  site: 'hub',          // this archive itself
  beatMs: 20000,        // heartbeat interval
  pollMs: 20000,        // how often we re-read the counts
};
