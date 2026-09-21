<p align="center">
  <img src="logo.png" alt="MyFinancial Market Data MCP" width="120" />
</p>

<h1 align="center">MyFinancial Market Data MCP</h1>

<p align="center">
  <strong>NSE & BSE stock market data inside Claude and any MCP client: 55 tools for quotes, financials, screeners, FII/DII flows, option chains and company filings. MyFinancial edition, powered by Tapetide.</strong>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" /></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-compatible-blue" alt="MCP compatible" /></a>
  <a href="https://tapetide.com"><img src="https://img.shields.io/badge/data-Tapetide-0b0b0b" alt="Data by Tapetide" /></a>
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> •
  <a href="#tools">55 tools</a> •
  <a href="#example-prompts">Example prompts</a> •
  <a href="#credits--disclaimer">Credits & disclaimer</a>
</p>

---

> ⚠️ **Not investment advice.** Everything this server returns (quotes, financials, screens, Tapetide
> Scores) is third-party data from Tapetide, for research and education. It is not a recommendation or
> solicitation by MyFinancial. Investments in securities market are subject to market risks. Read all
> the related documents carefully before investing.

## What is this?

MyFinancial Market Data MCP connects AI assistants to live data on all ~8,200 NSE and BSE listed stocks
through the [Model Context Protocol](https://modelcontextprotocol.io/). Ask Claude to look up a stock, run
a 326-ratio fundamental screen or a technical scan, pull quarterly results, read a concall transcript, or
check FII/DII flows and the NIFTY option chain, all in plain English.

It is MyFinancial's fork of Tapetide's open-source bridge,
[Tapetide-hq/nse-bse-indian-stock-market-data-mcp](https://github.com/Tapetide-hq/nse-bse-indian-stock-market-data-mcp)
(MIT). The fork changes how the server presents itself. The tools and the data are Tapetide's:

| | Comes from |
|---|---|
| Server name, title and instructions the client sees ("MyFinancial Market Data") | MyFinancial |
| Guide tool title (`read_me` → "MyFinancial Market Data Guide") | MyFinancial |
| Package, command, `MYFINANCIAL_*` settings, logs | MyFinancial |
| Preview mode (runs without a token) | MyFinancial |
| The 55 tools, their names, and every result they return (passed through unchanged) | Tapetide |
| Tapetide Score (`get_tapetide_score`, `screen_tapetide_scores`), which keeps Tapetide's name because the rating is theirs | Tapetide |
| Account, token, quota and rate limits | Your Tapetide account |

## Quick start

**You need** Node.js 18+ and a free Tapetide token (starts with `tpt_rt_`) from
[tapetide.com/settings/tokens](https://tapetide.com/settings/tokens).

### 1. Build

```bash
git clone https://github.com/myfinancialria/myfinancial-mcp.git
cd myfinancial-mcp
npm install && npm run build
```

### 2. Connect it to your AI client

**Claude Code** (available in every project; run from the repo folder):

```bash
claude mcp add myfinancial --scope user -e MYFINANCIAL_TOKEN=tpt_rt_your_token -- node "$PWD/dist/index.js"
```

**Claude Desktop:** Settings → Developer → Edit Config, then add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "myfinancial": {
      "command": "node",
      "args": ["/absolute/path/to/myfinancial-mcp/dist/index.js"],
      "env": { "MYFINANCIAL_TOKEN": "tpt_rt_your_token" }
    }
  }
}
```

**This folder as a project:** the repo includes a `.mcp.json`, so opening the folder in Claude Code offers
the `myfinancial` server automatically. It reads `MYFINANCIAL_TOKEN` from your environment, and starts in
preview mode if the token isn't set.

Cursor, VS Code, Windsurf and other stdio clients take the same `command` / `args` / `env` block.

### 3. Check it

```bash
MYFINANCIAL_TOKEN=tpt_rt_your_token npm run smoke
```

Leave the token out to check preview mode instead. Then ask your assistant: *"Use myfinancial to search for Reliance."*

### Preview mode

Upstream exits at startup when there's no token, so the server just shows as failed. This fork starts
anyway: the client sees all 55 tools, and each tool call returns the steps to activate instead of data.
Add the token and restart the client to go live.

## How it works

```
┌─────────────────┐  stdio (JSON-RPC)  ┌──────────────────────────┐   HTTPS   ┌─────────────────────┐
│  AI assistant   │ ◄────────────────► │  myfinancial-mcp         │ ◄───────► │  mcp.tapetide.com   │
│ (Claude, etc.)  │                    │  (this repo, local)      │           │  (Tapetide's tools) │
└─────────────────┘                    └──────────────────────────┘           └─────────────────────┘
```

A single-file TypeScript stdio bridge with zero runtime dependencies. It:

- Reads JSON-RPC from stdin, forwards it to Tapetide's remote MCP server and writes the reply to stdout
- Auto-detects framing: Content-Length (VS Code, Claude Desktop) or newline-delimited JSON (Claude Code, Kiro)
- Exchanges your refresh token for a 1-hour access token and refreshes it before expiry
- Re-brands the `initialize` and `tools/list` replies, and passes every other reply through unchanged
- Tells Tapetide which client is calling via `User-Agent` (`myfinancial-mcp/1.0.0 (claude-code/…)`)
- Warns on stderr when Tapetide rate-limits a call

Tools run on Tapetide's server, so new ones show up without updating this repo.

## Tools

> Tip: ask your assistant to call `read_me` first (shown as "MyFinancial Market Data Guide"). It returns
> the full in-session guide: every tool by category, and the usage rules the server expects.

<!-- tools:start — mirrors the server's tool catalog. Checked against the live server's tools/list by
     scripts/check-catalog-parity.mjs (CI: .github/workflows/ci.yml). When the catalog changes,
     regenerate this block; do not hand-edit an individual count. -->

### 🔍 Discovery & Screening (5 tools)

| Tool | Description |
|------|-------------|
| `search_stocks` | Resolve a company to its symbol by name, symbol, BSE code, or ISIN — including brand names and post-rename aliases (`Zomato` → `ETERNAL`). Filter by sector/industry. |
| `screen_stocks` | Fundamental screener over 326 ratios — PE, ROCE, sales growth, debt/equity, Piotroski score. Plain-English query syntax with AND/OR logic and cross-field comparisons. |
| `screen_stocks_technical` | Real-time technical screener — RSI, MACD, SMA/EMA crossovers, Bollinger Bands, ADX, volume, momentum. Supports `crosses_above`/`crosses_below`. |
| `get_screener_ratios` | Search or browse the full 326-ratio catalog to get exact ratio names for a query. |
| `get_trending_stocks` | Today's top gainers, losers, and most-active stocks from the Nifty 500. |

### 📊 Company Analysis (9 tools)

| Tool | Description |
|------|-------------|
| `get_company_profile` | Full overview — sector, business summary, pros/cons, fundamentals, growth metrics, current quote. Optionally add technicals (20+ indicators), analyst ratings, and peers in the same call. |
| `get_stock_quote` | Live price — LTP, change %, volume, market cap, PE, PB, 52-week high/low. |
| `get_batch_quotes` | Up to 20 stock quotes in a single call. |
| `get_price_history` | Daily or weekly OHLCV with delivery %. Up to 2,000 sessions per call, pageable further back. |
| `get_financials` | Quarterly + annual P&L, balance sheet, cash flow, and ratios. Each period is stamped with when it was actually published, so backtests can avoid look-ahead bias. |
| `get_shareholding` | Promoter, FII, DII, and public holdings quarter by quarter. |
| `get_forecasts` | Analyst EPS, revenue, EBITDA, net income, ROA, and ROE estimates against actuals — for spotting earnings surprises. |
| `get_stock_events` | Sentiment-tagged news, corporate actions (dividends, splits, bonuses, AGMs), and filings (results, presentations, concall transcripts, annual reports). |
| `get_stock_ownership` | Dividend history with yields + which mutual fund schemes hold the stock and at what share of AUM. |

### 🏛️ Market-Wide Data (11 tools)

| Tool | Description |
|------|-------------|
| `get_market_pulse` | The at-a-glance daily snapshot — FII/DII net flows, Nifty 50 valuations, and India VIX in one call. |
| `get_fii_dii_detail` | 30 days of daily cash-market flows, F&O participant long/short OI, weekly/monthly/yearly aggregates, buy/sell streaks, cumulative net flows. |
| `get_fii_dii_flows` | Alias of `get_fii_dii_detail`. |
| `get_fpi_sectors` | FPI investment by sector — AUM share, fortnightly change, 1-year cumulative flow. |
| `get_market_news` | Market-wide news across categories with sentiment and related symbols. |
| `get_market_data` | One dispatcher for seven daily feeds via `dataset`: `deals`, `fno_ban`, `deliveries`, `ipo`, `mtf`, `slbm`, `signals`. |
| `market_heatmap` | Every constituent of an index with market cap, PE, PB, returns from 1d to 5y, volume, sector — 16 indices. |
| `market_valuations` | Index PE, PB, and dividend yield over time. Up to 20 years. |
| `get_india_vix` | The India VIX fear gauge — latest level, daily change, recent history. |
| `get_index_performance` | Rank ~140 NSE indices by return over completed weeks or months. Filter to sectoral, broad, thematic, or strategy families — the right answer to "which sector led last month". |
| `get_index_history` | OHLC level series plus PE/PB/dividend yield for a single index. The index counterpart of `get_price_history`. |

### 🎲 Derivatives & Risk (5 tools)

| Tool | Description |
|------|-------------|
| `get_option_chain` | Per-strike index option chain with IV, full Greeks, bid/ask, open interest, max pain, PCR. NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY — a stamped end-of-day snapshot. |
| `get_option_iv_history` | Session-by-session ATM IV, IV rank, IV percentile, realised vol, PCR, max pain, 25-delta skew for ~556 underlyings, individual stocks included. |
| `get_options_analytics` | Latest per-expiry aggregates — ATM IV, IV rank/percentile, realised vol, PCR by OI and volume, max pain, skew, call/put OI. |
| `get_promoter_pledge` | Promoter share-pledge percentage by quarter plus pledge/release events — a standard governance red-flag check. |
| `get_credit_ratings` | Credit-rating actions by agency with rating, action, and outlook over time. |

### 🔬 Research & Scoring (4 tools)

| Tool | Description |
|------|-------------|
| `get_stock_deals` | Bulk, block, insider, and substantial-acquisition (SAST) disclosures per stock, with counterparty, side, quantity, value. |
| `get_tapetide_score` | Tapetide's deterministic 0-100 Tapetide Score for one stock with its six pillar sub-scores, band, percentile, data confidence, and any governance caps or red flags. |
| `screen_tapetide_scores` | Rank and filter Tapetide's scored universe by band, size bucket, sector, score window, and confidence, with cursor pagination. |
| `get_earnings_call_summary` | Structured digest of recent earnings-call transcripts and investor presentations — highlights, risks, guidance, headline metrics. |

### 📄 Filings & Documents (3 tools)

| Tool | Description |
|------|-------------|
| `list_company_documents` | Index of a company's filings parsed to text — concall transcripts, annual reports, presentations, IPO documents — with doc IDs, periods, page counts, and links to the PDF and Markdown. Call first. |
| `get_document_summary` | Investor digest of one parsed filing — summary, highlights, risks, guidance, key metrics — by doc ID, or the newest of a document type. |
| `read_document` | Markdown text of a parsed filing by page range, with page markers to cite. Up to 12 pages per call; annual reports run 100-400 pages. |

### ⏳ Point-in-Time & Backtest Safety (5 tools)

| Tool | Description |
|------|-------------|
| `get_adjustment_factors` | Split and bonus adjustment timeline for reconstructing raw prices — plus the rights and demerger events that carry no reliable factor at all. |
| `get_observation_status` | Per-calendar-day reason a price is present or missing: traded, weekend, holiday, pre-listing, delisted, or no print. A missing day is not a zero return. |
| `get_index_membership_asof` | Was a stock in an index on a given date? Answers `present`, `uncertain`, `absent`, or `out_of_coverage` — survivorship-bias-aware universe construction. |
| `resolve_identifier_asof` | Map a historical symbol or ISIN to the company that held it on a date, for old holdings files and recycled tickers. |
| `get_identifiers_asof` | The reverse lookup — which symbol and ISIN a company traded under at a point in time. |

### 💼 Portfolio (4 tools)

Stored in your Tapetide account.

| Tool | Description |
|------|-------------|
| `get_user_portfolio` | Holdings with live prices, absolute and % P&L, invested value, weight, sector, market-cap class. |
| `add_portfolio_stocks` | Add holdings singly or in bulk, including rows parsed from a broker CSV or screenshot (Zerodha, Groww, Angel One, Dhan, Upstox, 5Paisa, ICICI Direct, Kotak, HDFC Sky, Motilal Oswal). Duplicates merge on a weighted-average price. |
| `update_portfolio_stock` | Update quantity and average price after a top-up or partial sell. |
| `remove_portfolio_stocks` | Remove holdings from the portfolio. |

### 👁️ Watchlist (3 tools)

Stored in your Tapetide account.

| Tool | Description |
|------|-------------|
| `get_watchlist` | Every followed stock with sector and industry. |
| `add_to_watchlist` | Follow one or many stocks. Idempotent. |
| `remove_from_watchlist` | Unfollow one or many stocks. |

### 📖 Guide & Aliases (6 tools)

| Tool | Description |
|------|-------------|
| `read_me` | The full in-session guide ("MyFinancial Market Data Guide") — every tool by category, the SEBI disclaimer rule, portfolio-first behaviour, parallel-call patterns. Assistants should call it first. |
| `scan_movers` | Alias of `get_trending_stocks`. |
| `get_live_quote` | Alias of `get_stock_quote`. |
| `get_stock_news` | Alias of `get_stock_events` with `type: "news"`. |
| `get_corporate_actions` | Alias of `get_stock_events` with `type: "corporate_actions"`. |
| `run_preset_screen` | Redirect that points a preset-screen request at the screener tool that can actually answer it. |

<!-- tools:end -->

### Retired tool names

Tapetide removed these. Calling one returns a message naming its replacement, so a client can recover in
the same turn, but new integrations should use the replacement directly.

| Retired | Replacement |
|---------|-------------|
| `market_deals` | `get_market_data` with `dataset: "deals"` |
| `market_fno_ban` | `get_market_data` with `dataset: "fno_ban"` |
| `market_deliveries` | `get_market_data` with `dataset: "deliveries"` |
| `market_ipo` | `get_market_data` with `dataset: "ipo"` |
| `market_mtf` | `get_market_data` with `dataset: "mtf"` |
| `market_slbm` | `get_market_data` with `dataset: "slbm"` |
| `market_signals` | `get_market_data` with `dataset: "signals"` |
| `get_quant_signal` | `get_tapetide_score` (a different measurement, not a rename) |
| `screen_by_quant_signal` | `screen_tapetide_scores` (a different measurement, not a rename) |

## Example prompts

**Company research**

```
"Give me a complete picture of Reliance Industries — financials, debt trend,
 analyst targets, and which mutual funds hold it"

"Compare HDFC Bank and ICICI Bank — quarterly profit growth, ROE, shareholding
 changes, and analyst consensus"

"Summarise TCS's latest concall — guidance, risks, and what management said
 about margins"
```

**Screening**

```
"Find mid-caps where FII holding rose last quarter, ROE > 15% and RSI below 40"

"Which small-caps have debt-to-equity below 0.5, operating margin above 20%,
 and PE below 15?"
```

**Flows, derivatives and the market**

```
"FIIs have sold for 5 days — show the daily numbers and the sectors they're leaving"

"Show the NIFTY option chain around ATM — OI by strike, max pain and PCR"

"Is the market expensive? Nifty 50 PE against its 5- and 10-year averages"

"Full market briefing — FII/DII flows, F&O ban list, bulk deals above ₹50 crore,
 top delivery stocks and breakout signals"
```

**Risk and backtest checks**

```
"Any governance red flags on this stock? Check promoter pledge and recent
 credit rating actions"

"Was IDEA in the Nifty 500 on 2019-03-31? I need point-in-time membership"
```

## Data coverage

| Category | What's included |
|----------|----------------|
| **Stocks** | All NSE + BSE listed companies (~8,200 including SME) |
| **Price data** | Daily OHLCV up to 2,000 days + weekly aggregation + delivery % |
| **Financials** | Quarterly + annual P&L, balance sheet, cash flow, 50+ ratios |
| **Screener** | 326 fundamental ratios + real-time technical indicators + cross-field comparisons |
| **Technicals** | RSI, SMA, EMA, MACD, Bollinger Bands, ADX, ATR, Supertrend, Stochastic, CCI, pivot points, 8 candlestick patterns |
| **Institutional** | FII/DII daily cash flows, F&O participant OI, FPI sector-wise allocation, buy/sell streaks |
| **Market data** | Bulk/block deals, F&O ban, IPOs, delivery %, MTF, SLBM, heatmaps, signals |
| **Indices** | ~140 NSE indices — level history with PE/PB/DY, plus weekly/monthly return rankings |
| **Derivatives** | Index option chains with IV and full Greeks, OI, max pain, PCR; IV rank/percentile and realised-vol history for ~556 underlyings; India VIX |
| **Analyst** | Buy/hold/sell consensus + EPS/revenue/EBITDA/ROE forecasts with actuals vs estimates |
| **Ownership** | Shareholding patterns (quarterly), dividend history, mutual fund scheme-level holdings |
| **Filings** | Concall transcripts, annual reports, investor presentations and IPO documents, parsed to text with digests |
| **Governance & risk** | Promoter share-pledge history and events, credit-rating actions by agency with outlook |
| **Scoring** | Tapetide Score — Tapetide's 0-100 rating with six pillar sub-scores, band, percentile, data confidence |
| **Point-in-time** | Split/bonus adjustment factors, per-day observation status, as-of index membership, historical symbol/ISIN resolution |
| **Portfolio** | Live P&L tracking, sector breakdown, broker CSV import (10+ Indian brokers) |

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MYFINANCIAL_TOKEN` | For live data | none (preview mode) | Your Tapetide token from [tapetide.com/settings/tokens](https://tapetide.com/settings/tokens) |
| `MYFINANCIAL_MCP_URL` | No | `https://mcp.tapetide.com` | Remote server URL |
| `MYFINANCIAL_DEBUG` | No | `0` | Set to `1` to log each call's method, status and timing to stderr |

The upstream names `TAPETIDE_TOKEN`, `TAPETIDE_MCP_URL` and `TAPETIDE_DEBUG` still work. If both are set,
the `MYFINANCIAL_` one wins.

## Rate limits

Limits come from your Tapetide plan and are the same whichever way you connect.

| Scope | Free plan | Paid plans |
|-------|-----------|------------|
| Per day | 50 tool calls | Per your plan |
| Per calendar month | 1,000 tool calls | Per your plan |
| Burst | 60 tool calls per minute | 60 tool calls per minute |

Only successful tool calls count. `initialize`, `tools/list` and denied calls are free, and preview mode
never touches your quota. Daily and monthly windows reset on IST boundaries. When you hit a limit, the tool
result says which cap applied and when it resets. Check usage at
[tapetide.com/settings/tokens](https://tapetide.com/settings/tokens).

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Tool calls say "preview mode" | The token isn't reaching the server. Put `MYFINANCIAL_TOKEN` in the server's `env` block and restart the client |
| `Failed to authenticate` / `Token refresh failed (401)` | The token is wrong or revoked. Create a new one at [tapetide.com/settings/tokens](https://tapetide.com/settings/tokens) |
| Rate limit message | Wait for the reset time given in the message, or check usage on Tapetide |
| Server won't start | Check `node --version` is 18+, and that you ran `npm run build` (clients run `dist/index.js`) |
| Network errors | The bridge has to reach `mcp.tapetide.com` |

Set `MYFINANCIAL_DEBUG=1` for per-call logging on stderr.

## Keeping up with upstream

Tapetide's bridge changes rarely, and `src/index.ts` keeps its structure so merges stay small:

```bash
git remote add upstream https://github.com/Tapetide-hq/nse-bse-indian-stock-market-data-mcp.git  # once
git fetch upstream && git merge upstream/main
npm run build && npm run smoke && npm run check:catalog
```

`npm run check:catalog` compares the tool list in this README with the live server, so you'll know when
Tapetide adds or retires a tool.

## Credits & disclaimer

- **Data and tools: [Tapetide](https://tapetide.com).** Use is governed by
  [Tapetide's Terms of Use](https://tapetide.com/terms): use your own token, don't share or publish it,
  and don't redistribute or resell the data, or build a competing data service on it, without Tapetide's
  permission. Tapetide states that it is not a SEBI-registered investment adviser, research analyst or broker.
- **Original bridge:** [Tapetide-hq/nse-bse-indian-stock-market-data-mcp](https://github.com/Tapetide-hq/nse-bse-indian-stock-market-data-mcp),
  MIT licensed. This fork keeps Tapetide's copyright notice.
- **Not investment advice.** Output is for information and research only. It is not a recommendation by
  MyFinancial, and the Tapetide Score is Tapetide's methodology, not a MyFinancial rating. Investments in
  securities market are subject to market risks. Read all the related documents carefully before investing.

## License

[MIT](./LICENSE). Original bridge © 2025 Tapetide; MyFinancial modifications © 2026 MyFinancial.

---

<p align="center">
  <sub>MyFinancial edition · data by <a href="https://tapetide.com">Tapetide</a></sub>
</p>
