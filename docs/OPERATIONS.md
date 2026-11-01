# Contract and launch operations

## Current deployment

| Item | Value |
| --- | --- |
| Network | BNB Smart Chain, chain ID 56 |
| JIN contract | `0x086Ab11dF23e8FD37398C41180466D24d85ed5FB` |
| Treasury / scheduling authority | `0x8dE2893F792Bc6B818124a3B394EF728E926a961` |
| Binance-issued .ai collection | `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F` |
| Deployment transaction | `0xea08451219dc3867f463860c9a511b50309121e9dd789f765b5e9803cb66d142` |
| Confirmed deployment block | `131050353` |
| Initial opening state | `opensAt = 0`, closed/TBA |

[Verified source on Sourcify](https://repo.sourcify.dev/56/0x086Ab11dF23e8FD37398C41180466D24d85ed5FB) has exact creation and runtime matches. This is source matching, not a security audit. Automatic BscScan verification submission hit the verification service's daily quota.

These are recorded deployment facts. Query current chain state before any action; the documentation is not a live status feed.

## Requested opening

The owner selected November 2, 2026 at 08:00 UTC (09:00 Africa/Lagos), Unix timestamp `1793606400`. The frontend countdown is configured. On-chain scheduling is pending owner signing; do not treat the countdown as proof that `scheduleMint` has been executed. Binance Wallet API requests timed out during preparation. Re-read `opensAt()` and preview the transaction before requesting final broadcast approval.

## Open minting only when instructed

1. Obtain the explicit opening date, time and timezone from the owner. Convert that time to Unix seconds and show the human-readable value and timestamp for review.
2. Connect the treasury wallet. Confirm chain 56, contract address, wallet address, current `opensAt()` and available gas. Binance CLI sessions, Developer Mode and authorization limits belong to the owner; never commit session data or private keys.
3. If `opensAt()` is already nonzero, **stop**. Scheduling is one-time: the contract has no reschedule, cancellation or pause function.
4. Simulate `scheduleMint(uint64 launchTime)` from the treasury. Review the exact transaction and fee; get explicit approval before broadcasting. The chosen time must not be in the past.
5. Wait for a successful receipt and re-read `opensAt()`. Update the website copy, `llms.txt`, launch specification and fallback snapshot to match the actual schedule, then publish.
6. Check a read-only eligibility query and simulation after opening. Do not spend visitor funds or perform an owner test mint without a separate instruction.

Deploying or moving the website does not schedule opening. Do not redeploy the token just to change hosting.

## Funds and pool

Only the immutable treasury can call `withdraw()`. It withdraws the contract's full native BNB balance to that treasury; it does not allocate liquidity. Treat this as a separate reviewed wallet action.

The 10,000-mint pool milestone counts **paid units**, not free claims, wallets or transaction count. Opening is manual. There is no reserved liquidity token supply, pool creation call, LP lock/burn, automated 80/20 allocation or refund path in this contract. Pool funding, tokens and DEX parameters require a separate plan before opening the pool.

## Source changes

The deployed contract is immutable. Editing `contracts/JinMint.sol` changes local source, not the deployed code. Do not replace `dist/JinMint.json` with a different implementation's artifact while keeping the existing contract address. Keep the compiler version/settings and verification input associated with the deployed code.

`npm test` uses a local Ganache chain and test-only mock identities. It does not send mainnet transactions. `prepare-deployment.mjs` produces deployment data; it is not an instruction to deploy again. `confirm-deployment.mjs` verifies the specified receipt and settings. `verify-source.mjs` submits public source for verification and requires the ignored local artifacts from the original deployment.
