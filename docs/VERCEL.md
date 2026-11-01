# GitHub and Vercel deployment

## Repository boundary

Push the contents of the `jin-agent` project directory, not its parent Codex workspace. Include the committed `dist/`, `contracts/`, `scripts/`, `docs/`, package manifest/lockfile and `vercel.json`.

Do not upload `node_modules/`, `artifacts/`, `.git/`, `.vercel/`, `.env` files, wallet session files, or the parent workspace's `work/` directory. Binance credentials and signing sessions are outside the project. `.openai/hosting.json` is hosting identity for the current Sites deployment; it contains no wallet key and Vercel ignores it.

No GitHub repository or Vercel project has been created or connected by these instructions.

## Vercel import settings

1. Import the chosen GitHub repository in Vercel.
2. Framework preset: **Other**. Root directory: the repository root if `dist/` and `vercel.json` are there; otherwise select the project subdirectory.
3. The committed `vercel.json` selects `dist` as output directory, disables the build step, and skips dependency installation. The already-committed HTML/assets are deployed directly.
4. No environment variables or private keys are required for the current static frontend.
5. Deploy and run the checks below before making the Vercel/custom domain canonical.

For contract development separately: Node.js and npm are required; run `npm ci`, `npm run compile`, and `npm test`. These are not Vercel build steps and never deploy a contract. Local preview uses `npm run preview` and requires Python 3.

## Domain migration

The copyable prompt uses `location.origin`, so it automatically points to the host being visited. However, `dist/llms.txt` currently declares the existing Sites URL as the official website. Once the final Vercel/custom domain is chosen:

1. Change the `Official website:` line in `dist/llms.txt` to that final HTTPS origin.
2. Update any published project/social links to the chosen canonical origin. Decide whether to keep or redirect the old host; this is not configured automatically.
3. Check that `/llms.txt`, `/config.js`, `/JinMint.json`, and `/launch-spec.md` remain publicly retrievable. Deployment Protection must not block visitors' agents on the intended public production domain.
4. Do not change the deployed contract address, treasury, supply or price merely because hosting changes.

The current Sites access policy does not migrate to Vercel. Review the new project's access deliberately. Preview deployments are not automatically the canonical production site.

## Acceptance checks

- `/` loads in Chinese; header toggle switches all visible labels to English.
- All hash section links work; `/llms.txt`, `/launch-spec.md`, `/config.js`, `/JinMint.json` and all assets return the intended content.
- One unit shows 1,000 JIN and 0.002 BNB; five paid units show 5,000 JIN and 0.010 BNB; free mode shows zero mint payment, with gas separate.
- The contract/explorer and Sourcify links point to the deployed BSC contract.
- Mint is closed/TBA while on-chain `opensAt()` is zero. Do not submit a real mint as a hosting smoke test.
- Copy prompt contains the new host and selected quantity. The entered `.ai` name is normalized correctly.
- Mobile layout fits the viewport and keyboard navigation reaches labels, links and controls.
- If the public RPC fails, the UI shows its labeled snapshot and stays disabled. No session credential or private key is present in the repository or deployment.

## Rollback and hosting limitations

Rollback through Vercel's deployment history or revert the source commit and redeploy. This changes only the frontend. It cannot undo blockchain deployment, cancel a scheduled opening, refund a mint, or change immutable contract settings.

The site depends on a public BSC RPC for live reads and an injected browser wallet for browser transactions. There is no server proxy or WalletConnect integration. Agent-based minting follows `llms.txt` through the user's own wallet-enabled agent.

Sources: [Vercel project configuration](https://vercel.com/docs/project-configuration), [Vercel configuration reference](https://vercel.com/docs/project-configuration/vercel-json).
