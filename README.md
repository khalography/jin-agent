# 金小灵 · JIN Agent

Chinese-first responsive minting website, original mascot, English toggle, EIP-1193 wallet connection, and a deployed fixed-price Solidity mint (opens November 2, 2026 at 08:00 UTC).

## Run
`npm ci`, `npm run compile`, `npm test`, `npm run preview`.

For frontend preview alone, `npm run preview` serves the committed `dist/` without installing dependencies; it requires Python 3. Contract development uses Node.js and npm. Compilation never sends a transaction.

## Documentation and Vercel

- [Page map and frontend behavior](docs/PAGES.md)
- [GitHub/Vercel deployment and domain migration](docs/VERCEL.md)
- [Contract, scheduling and treasury runbook](docs/OPERATIONS.md)
- [Public launch specification](dist/launch-spec.md)
- [Agent-readable mint instructions](dist/llms.txt)

Vercel serves the committed `dist/` as a static site using `vercel.json`. Select the **Other** framework preset and the project root. No frontend environment variables or wallet secrets are needed. The final GitHub destination and canonical Vercel/custom domain still need to be chosen before pushing and migrating the official URL.

## Deployment status
The contract is deployed on BNB Smart Chain at 0x086Ab11dF23e8FD37398C41180466D24d85ed5FB. Deployment transaction: 0xea08451219dc3867f463860c9a511b50309121e9dd789f765b5e9803cb66d142. Sourcify reports exact creation and runtime matches. Minting opens November 2, 2026 at 08:00 UTC: opensAt = 1793606400, confirmed on-chain. The treasury is 0x8dE2893F792Bc6B818124a3B394EF728E926a961.

The minting model is 14,444 units (4,444 free + 10,000 paid), following BNB City and Fagent. Sensei uses a different 4,440,000-unit model. Paid mint price is fixed at 0.002 BNB, with 1,000 JIN per unit. This is a fungible token mint, not an NFT collection. The guardian image is brand artwork.

## Contract deployment
Use the reviewed Binance Agentic Wallet preview/execute flow. `scripts/prepare-deployment.mjs <signer>` verifies chain 56, the standard CREATE2 proxy runtime, caligraphy.ai ownership, the predicted address, and a gas estimate. It writes public transaction data to ignored `artifacts/deployment.json`. The constructor explicitly receives the authenticated signing wallet as treasury because the proxy is the immediate deployer.

The contract directly verifies the Binance-issued .ai collection at 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F. Mint calls include the lowercase Agent ID handle without .ai. No external adapter or identity binding transaction is needed. Test mock collections are installed only into a local Ganache chain.

Minting starts closed (TBA). The treasury alone can schedule opening once. The contract has no admin mint, upgrade, price change, tax, automated liquidity, referral expansion, or refunds. The pool-opening milestone is manual after all 10,000 paid units sell out; there is no separately reserved liquidity supply.

After a confirmed deployment: verify source, read back treasury/registry/price/allocation/caps/opensAt, configure the actual contract address, update the status copy, and republish. The opening schedule is now confirmed; do not schedule again. The browser `/deploy.html` is informational and never sends transactions.

## Assets
`dist/assets/jin-guardian.png`: original built-in ImageGen artwork. Prompt: A premium designer collectible golden guardian, round body, two gold horns, glossy black visor and warm glowing eyes, waving paw, charcoal utility sash and diamond charm, floating over a gold pedestal with geometric diamonds, warm ivory background, soft studio shadows, no lettering or Binance logos.
`dist/assets/mark.svg`: original vector brand mark. CSS creates orbit accents and page decoration.

## References
https://anxiaojiang.xyz/ · https://senseiagent.xyz/#mint · https://bnbcity-id.fun/ · https://fagent.online/mint · https://bibiai.meme/project

The BIBIAI project URL returned a page-not-found screen. This site uses its own branding and assets; it does not reuse reference contracts or artwork.

## Technical sources
[ethers documentation](https://docs.ethers.org/v6/single-page/) · [OpenZeppelin ERC20 documentation](https://docs.openzeppelin.com/contracts/5.x/erc20).

## Agent prompt and revised artwork
The mint section includes a bilingual copyable prompt that follows the paid/free choice and selected quantity, with an agent-readable `dist/llms.txt` workflow. Both explicitly stop mint transactions while opening is unscheduled or in the future.
`dist/assets/jin-guardian-bnb.png` was edited using built-in ImageGen from the original artwork. Edit prompt: preserve the guardian, pose, ivory background, pedestal and lighting; replace all floating Ethereum-like diamonds, the pouch pendant and pedestal engraving with recognizable gold BNB geometric logos; no text, numbering, edition labels or watermark. The edition overlay was removed from the page markup. Original asset retained as source history.

Pool milestone copy: “Pool opens at 10,000 mints” / “10,000 份铸满开池”. The detailed rules specify paid units only and manual pool opening; the treasury-only mint has no automatic liquidity action.
