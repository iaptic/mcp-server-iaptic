# Installing mcp-server-iaptic (instructions for AI agents)

This MCP server gives read access to a user's Iaptic data (customers, purchases, transactions, events, statistics) over stdio. It is published on npm as `mcp-server-iaptic` and needs no build step.

## 1. Ask the user for two values

- **App name**: shown as "App Name" in the Iaptic dashboard, **Settings** page (https://www.iaptic.com).
- **Secret Key**: shown as "Secret Key" on the same page. Treat it as a secret: don't echo it back, log it or commit it.

Users who manage several apps may have a **master key** instead. In that case set `IAPTIC_MASTER_KEY` in place of `IAPTIC_API_KEY`; the app name is still required, and every data tool then takes an `appName` argument.

## 2. Add the server to the MCP settings

Requires Node.js >= 18 (`npx` must be on the PATH). Add this entry under `mcpServers`, keeping any existing servers:

```json
{
  "mcpServers": {
    "iaptic": {
      "command": "npx",
      "args": ["-y", "mcp-server-iaptic"],
      "env": {
        "IAPTIC_API_KEY": "<Secret Key>",
        "IAPTIC_APP_NAME": "<App Name>"
      }
    }
  }
}
```

## 3. Check it works

Call the `iaptic_current_app` tool: it should return the app name. Then call `stats_get`; an authentication error means the app name or key is wrong.

## What the tools can do

Tools only read Iaptic data. The exceptions: `stripe_checkout` and `stripe_portal` create Stripe Checkout / Customer Portal sessions (links for the user's customers), and `iaptic_switch_app` / `iaptic_reset_app` change which app later queries use. See the README for the full tool list.
