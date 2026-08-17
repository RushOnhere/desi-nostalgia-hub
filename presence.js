/* Live badge counts.
   Sites that embed badge.js report their own listeners; this reads those
   aggregates so a badge-carrying card shows a measured count instead of a
   scraped one.

   The key below is Supabase's publishable key. It is meant to be public: row
   level security denies all direct table access, and the only things it can
   call are heartbeat() and live_counts(), which return aggregates. */
window.PRESENCE = {
  url: 'https://iomcpnyfnuvujgzamtbp.supabase.co',
  key: 'sb_publishable_ahLqxPOO8qFkYgQIJAQW6g_5CbDAdb5',
  pollMs: 20000,        // how often we re-read the counts
};
