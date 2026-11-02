# Referral backend

Project: qrdbjykjdrlotofutzxw (jin-agent-referrals, Ireland).
Endpoint: https://qrdbjykjdrlotofutzxw.supabase.co/functions/v1/referrals

The endpoint keeps legacy JWT gateway verification enabled. The browser uses only the public anon JWT in dist/referral-config.js. The service-role key remains in Supabase's built-in function environment; never add it to frontend files or GitHub.

Register before the first paid mint. The referred wallet signs a ten-minute EIP-712 challenge with the referrer, referred handle, wallet, nonce and expiry. The backend verifies the signature and both current registry owners, rejects self-referrals and existing paid minters, then uses a backend-only SQL transaction to consume the challenge and bind the stable identity once. A binding cannot be reassigned to another referrer. A query parameter alone does not establish attribution.

Status requests recheck up to 12 pending referrals against the contract's paidByIdentity mapping, 64 blocks behind the tip, rotating by oldest checked block. Full 9-unit referrals qualify. An atomic row-locked allocator assigns each referred identity to at most one group of three. Each group records 1,000 JIN pending manual distribution. No backend private key is configured and no token transfers are sent automatically. Funding and a separate reviewed payout process are required.

Frontend status refresh is 30 seconds while a referrer is selected. Demo names are removed. ?ref=handle is retained for the current browser session and included in the agent mint prompt; registration is performed by the agent after user signature approval. No browser-wallet connection is required by this flow.

Database SQL lives in supabase/sql/referral-backend.sql; function source is supabase/functions/referrals/index.ts. Initial tables were created in the Supabase SQL editor, with RLS enabled and anon/authenticated table access revoked. SQL functions are SECURITY INVOKER and executable only by service_role.

The original mint contract, price, quotas, treasury and opening schedule are unchanged. Publishing the frontend requires a reviewed GitHub push; backend deployment alone does not update the public website.
