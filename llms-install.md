# MyFinancial Market Data MCP — Installation Guide for AI Agents

MyFinancial's branded fork of Tapetide's NSE/BSE stock market MCP bridge. The data and tools come from
Tapetide (https://tapetide.com). Use is subject to Tapetide's Terms of Use: each user supplies their own
token, and tokens must never be shared or published.

## Prerequisites

- Node.js 18 or later
- A free Tapetide token (starts with `tpt_rt_`) from https://tapetide.com/settings/tokens. The user must
  create it themselves; never create accounts or tokens on their behalf.

## Install

```bash
git clone https://github.com/myfinancialria/myfinancial-mcp.git
cd myfinancial-mcp
npm install && npm run build
```

## Configure (stdio)

Use the absolute path to `dist/index.js`:

```json
{
  "mcpServers": {
    "myfinancial": {
      "command": "node",
      "args": ["/absolute/path/to/myfinancial-mcp/dist/index.js"],
      "env": {
        "MYFINANCIAL_TOKEN": "tpt_rt_your_token_here"
      }
    }
  }
}
```

Claude Code equivalent, run from the repo folder:

```bash
claude mcp add myfinancial --scope user -e MYFINANCIAL_TOKEN=tpt_rt_your_token_here -- node "$PWD/dist/index.js"
```

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MYFINANCIAL_TOKEN` | For live data | none (preview mode) | Tapetide token from https://tapetide.com/settings/tokens |
| `MYFINANCIAL_MCP_URL` | No | `https://mcp.tapetide.com` | Override the remote server URL |
| `MYFINANCIAL_DEBUG` | No | `0` | Set to `1` for per-call logging to stderr |

`TAPETIDE_TOKEN`, `TAPETIDE_MCP_URL` and `TAPETIDE_DEBUG` are accepted as fallbacks.

## How it works

A zero-dependency stdio bridge. It forwards JSON-RPC to Tapetide's remote MCP server at
`https://mcp.tapetide.com/mcp`, presents itself to the client as "MyFinancial Market Data", and passes every
tool result through unchanged. All tool logic runs on the remote server.

Without a token it runs in **preview mode**: `initialize` and `tools/list` work (the full catalog is shown),
and each tool call returns activation steps instead of data.

## Tools

55 tools across discovery and screening, company analysis, market-wide data, derivatives, research and
scoring, filings and documents, point-in-time data, portfolio and watchlist. See the catalog in
[README.md](./README.md#tools). Call `read_me` first for the in-session guide.

## Verification

```bash
MYFINANCIAL_TOKEN=tpt_rt_your_token_here npm run smoke
```

It should report `Server: MyFinancial Market Data`, 55 tools, and a successful `search_stocks("Reliance")` call.
Without a token it checks preview mode instead.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Tool calls return "preview mode" | Add `MYFINANCIAL_TOKEN` to the `env` section and restart the client |
| `Token refresh failed (401)` | Token is wrong or revoked. Generate a new one at https://tapetide.com/settings/tokens |
| Rate limit message | Free plan: 50 calls/day, 1,000/month, 60/minute. Wait for the reset time in the message |
| Network errors | The bridge needs to reach `mcp.tapetide.com` |

Set `MYFINANCIAL_DEBUG=1` for detailed logging.
