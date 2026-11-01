# 金小灵 · JIN Agent / Launch specification

Status: DEPLOYED — planned opening November 2, 2026 at 08:00 UTC (Unix 1793606400). Website countdown configured; on-chain scheduling pending owner signing.

Contract: 0x086Ab11dF23e8FD37398C41180466D24d85ed5FB
Deployment transaction: 0xea08451219dc3867f463860c9a511b50309121e9dd789f765b5e9803cb66d142
Treasury: 0x8dE2893F792Bc6B818124a3B394EF728E926a961
Verified source: https://repo.sourcify.dev/56/0x086Ab11dF23e8FD37398C41180466D24d85ed5FB
Exact creation and runtime bytecode match on Sourcify. BscScan auto-submission hit the verification service daily quota.

独立社区项目，与 Binance 官方无隶属或背书关系。
Independent community project; not affiliated with or endorsed by Binance.

## Mint parameters / 铸造参数
- Network: BNB Smart Chain, chain ID 56.
- Paid units: 10,000. Fixed price: 0.002 BNB per unit, plus gas.
- Free units: 4,444. Gas still applies.
- Per identity: 1 free unit and up to 9 paid units.
- Tokens per unit: 1,000 JIN (18 decimals).
- Free mint token allocation: 4,444,000 JIN. Paid mint token allocation: 10,000,000 JIN.
- Maximum mint allocation: 14,444,000 JIN. No team or liquidity allocation in this implementation.
- Quotas follow a stable identity key, not the wallet address.
- Pool opens at 10,000 mints / 10,000 份铸满开池. This means all 10,000 paid mint units; free claims do not count. Opening is manual, not an automatic mint-contract action. Pair address will be announced after opening. No fixed liquidity percentage, LP lock or burn is implemented.
- No referral expansion, taxes, or automatic pool creation.
- BNB paid into the mint is withdrawable by the immutable treasury address. There is no refund function or automated liquidity allocation. Tokens are transferable immediately after minting.
- Unminted supply remains unissued; there is no extra mint function.

## Identity and deployment / 身份与部署
- The Binance-issued .ai collection on BNB Chain is 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F.
- The mint directly checks ownerOf(uint256(keccak256(bytes(handle)))) on that fixed collection. The handle excludes .ai and is 3–15 lowercase letters/digits. No separate adapter or generic SPACE ID ownership gate is used.
- The constructor receives the signing wallet explicitly as treasury because the deterministic deployment proxy is msg.sender during construction. The prepared transaction uses the connected Binance Agentic Wallet address as treasury.
- Deployment starts with opensAt = 0 (TBA / mint closed). The treasury can call scheduleMint(uint64) once; it cannot reschedule or cancel after that.
- Planned opening: November 2, 2026 at 08:00 UTC (Unix 1793606400). The countdown is informational until scheduleMint is confirmed on-chain.
- The verified contract address is configured. The website and contract keep minting closed until the treasury schedules opening.
- Minting does not guarantee financial returns, listing, liquidity, or refunds. Pool opening is manual after all 10,000 paid units sell out; liquidity must be sourced separately.
