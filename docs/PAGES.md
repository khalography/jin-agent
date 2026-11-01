# Pages and frontend structure

The website is a buildless HTML/CSS/JavaScript application. Serve `dist/` as the web root. There is no application server, database, login backend, or client-side router.

| URL | Source | Purpose |
| --- | --- | --- |
| `/` | `dist/index.html` | Chinese-first landing and mint page |
| `/#mint` | Same page | Mint calculator, Binance .ai handle input, wallet interaction, copyable agent prompt |
| `/#how` | Same page | Participation steps |
| `/#rules` | Same page | Allocation, pool milestone, chain and verified contract links |
| `/#faq` | Same page | Eligibility, price, mint status, manual pool opening and affiliation |
| `/llms.txt` | `dist/llms.txt` | Machine-readable mint instructions, exact ABI, spending and launch checks |
| `/launch-spec.md` | `dist/launch-spec.md` | Public contract/economic specification; served as Markdown text |
| `/deploy.html` | `dist/deploy.html` | Informational owner page; never sends transactions |

Hash sections are anchors in one document, not separate HTML pages. No catch-all rewrite is required. Missing files should remain 404s, particularly `config.js` and `llms.txt`.

## Main files

- `dist/style.css`: responsive layout, typography, colors and decorative styles. Google Fonts is optional external styling; system fallbacks remain available.
- `dist/app.js`: translations, quantity controls, Agent ID normalization, copy prompt, public chain reads, EIP-1193 browser wallet interaction, simulations and transaction receipts.
- `dist/config.js`: public chain ID, deployed mint address, RPC endpoint and confirmed fallback snapshot. This file must never contain secrets.
- `dist/JinMint.json`: committed ABI/bytecode/metadata artifact produced by `npm run compile`. Static hosting does not compile contracts.
- `dist/assets/ethers.min.js`: locally bundled wallet library. Runtime does not require a CDN for it.
- `dist/assets/jin-guardian-bnb.png`: current mascot. `jin-guardian.png` is the original asset retained as history.
- `dist/assets/mark.svg`, `bnb.svg`: brand and BNB marks.

## Language and wallet behavior

Chinese is the default. English labels live in the `en` dictionary and its overrides in `app.js`; Chinese labels are captured from `data-t` elements. New UI text needs both languages. Dynamic labels such as wallet status and mint status also need both versions. Pointing-arrow glyphs have been removed across both languages.

The `.ai` handle field accepts a name with or without the suffix. The app trims it, lowercases it and removes `.ai` before calling the contract. The contract independently validates lowercase letters/digits and current ownership.

Browser wallet support requires an injected EIP-1193 provider (`window.ethereum`). Binance Agentic Wallet users can instead copy the prompt into their wallet-enabled agent; installing the CLI does not automatically inject a provider into the browser.

The mint is scheduled for November 2, 2026 at 08:00 UTC (`opensAt = 1793606400`). The button stays disabled until a successful chain read establishes that the scheduled opening has arrived. A failed public RPC read displays a labeled, confirmed snapshot and keeps minting disabled. Agents must independently query `opensAt()` before every mint. A website deployment never opens the on-chain mint.

## Maintaining content

Keep `index.html`, translations in `app.js`, `llms.txt`, and `launch-spec.md` consistent. Token allocation is 1,000 JIN per unit; 4,444 free units plus 10,000 paid units, maximum 14,444,000 JIN. Pool opening at 10,000 paid units is manual, not an automatic contract action.

## Images, layout and language

The mascot uses responsive 400/640/960-pixel WebP assets. The hero has high fetch priority; the collectible image loads lazily. Explicit dimensions reserve space while decoding. Original PNG artwork is retained for editing, but is not requested by the page. The collectible card sizes to its own content.

Step icons are inline SVG wallet, identity verification and token allocation symbols. The site opts out of automatic browser translation because it provides its own Chinese/English toggle. Countdown ticks update the button without replacing static translated content; static wallet and launch labels update only when their state changes.
