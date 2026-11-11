# MCP Server for Iaptic

A Model Context Protocol server for interacting with the [Iaptic API](https://www.iaptic.com). This server allows Claude or other AIs to interact with your Iaptic data to answer questions about your customers, purchases, transactions, and statistics.

## Scope

The server is read-only with respect to your Iaptic data: tools can query customers, purchases, transactions, events and statistics, but cannot modify records, issue refunds, or change your Iaptic configuration. Three groups of tools operate outside stored data: `stripe_checkout` / `stripe_portal` are the only tools that create anything — Stripe checkout or billing-portal sessions (links your customer uses to pay or manage their subscription), never Iaptic records; `stripe_purchases` looks up a customer's purchases by checkout-session access token; and `iaptic_switch_app` / `iaptic_reset_app` change which app's credentials are used for subsequent queries.

## Installation

Requires Node.js >= 18 and an Iaptic app. In the [Iaptic dashboard](https://www.iaptic.com), open **Settings** to find your **App Name** and **Secret Key** (the API key).

```bash
# Run directly with npx
npx -y mcp-server-iaptic --api-key YOUR_API_KEY --app-name YOUR_APP_NAME

# Or install globally
npm install -g mcp-server-iaptic
mcp-server-iaptic --api-key YOUR_API_KEY --app-name YOUR_APP_NAME
```

### Configuration

Credentials come from command-line arguments or, as a fallback, environment variables (a `.env` file in the working directory is also read). Prefer environment variables in client configs: arguments show up in process lists.

| Argument | Environment variable | Description |
|---|---|---|
| `--app-name` | `IAPTIC_APP_NAME` | Your Iaptic app name. Always required. |
| `--api-key` | `IAPTIC_API_KEY` | Your app's Secret Key. Required unless a master key is set. |
| `--master-key` | `IAPTIC_MASTER_KEY` | Optional. Manage several apps from one server instead of an API key; every data tool then takes a required `appName` argument. |

## Usage with MCP clients

The server speaks MCP over stdio. Replace the placeholder values in each snippet.

### Claude Desktop

Add to `claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "iaptic": {
      "command": "npx",
      "args": ["-y", "mcp-server-iaptic"],
      "env": {
        "IAPTIC_API_KEY": "your-api-key-here",
        "IAPTIC_APP_NAME": "your-app-name-here"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add iaptic \
  -e IAPTIC_API_KEY=your-api-key-here \
  -e IAPTIC_APP_NAME=your-app-name-here \
  -- npx -y mcp-server-iaptic
```

### Cursor

Add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project):

```json
{
  "mcpServers": {
    "iaptic": {
      "command": "npx",
      "args": ["-y", "mcp-server-iaptic"],
      "env": {
        "IAPTIC_API_KEY": "your-api-key-here",
        "IAPTIC_APP_NAME": "your-app-name-here"
      }
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`. VS Code prompts for the key and keeps it out of the file:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "iaptic-api-key",
      "description": "Iaptic Secret Key",
      "password": true
    }
  ],
  "servers": {
    "iaptic": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-server-iaptic"],
      "env": {
        "IAPTIC_API_KEY": "${input:iaptic-api-key}",
        "IAPTIC_APP_NAME": "your-app-name-here"
      }
    }
  }
}
```

### Cline

Ask Cline to install it from this repository; it follows [`llms-install.md`](llms-install.md).

### Docker

```bash
docker build -t mcp-server-iaptic .
docker run -i --rm -e IAPTIC_API_KEY -e IAPTIC_APP_NAME mcp-server-iaptic
```

## Available Tools

### Customers
- `customer_list`: List customers with pagination
- `customer_get`: Get detailed customer information by ID
- `customer_subscription`: Get customer's active subscription status
- `customer_transactions`: Get customer's transaction history

### Purchases
- `purchase_list`: List purchases
  - `limit`: Maximum number of purchases to return (default: 100, max: 1000)
  - `offset`: Number of purchases to skip for pagination
  - `startdate`: Filter purchases after this date (ISO format, e.g. 2024-01-01)
  - `enddate`: Filter purchases before this date (ISO format, e.g. 2024-12-31)
  - `customerId`: Filter by customer ID
- `purchase_get`: Get purchase details by ID

### Transactions
- `transaction_list`: List transactions with pagination and date filtering
  - `limit`: Maximum number of transactions to return (default: 100, max: 1000)
  - `offset`: Number of transactions to skip for pagination
  - `startdate`: Filter transactions after this date (ISO format, e.g. 2024-01-01)
  - `enddate`: Filter transactions before this date (ISO format, e.g. 2024-12-31)
  - `purchaseId`: Filter by purchase ID
- `transaction_get`: Get transaction details by ID

### Statistics
- `stats_get`: Get general statistics about transactions and revenue
- `stats_app`: Get app-specific statistics

### Events
- `event_list`: List recent events with pagination and date filtering
  - `limit`: Maximum number of events to return (default: 100)
  - `offset`: Number of events to skip for pagination
  - `startdate`: Filter events after this date (ISO format, e.g. 2024-01-01)
  - `enddate`: Filter events before this date (ISO format, e.g. 2024-12-31)
  - `raw`: Return raw JSON instead of formatted output (default: false)
- `event_details`: Get detailed information about a specific event (validator 3.12+)
  - `eventId`: The event ID to get details for
  - `receipts`: Include receipt validation details (default: false)

### Stripe
- `stripe_prices`: Get available Stripe products and prices
- `stripe_checkout`: Create a Stripe Checkout session and return its payment link
  - `offerId`: Offer ID to purchase, as returned by `stripe_prices`
  - `successUrl`: URL to redirect the customer to after successful payment
  - `cancelUrl`: URL to redirect the customer to if they cancel
  - `applicationUsername`: User identifier in your application (optional)
  - `mode`: `payment` or `subscription` (optional; defaults per the price type)
  - `accessToken`: Access token from a previous purchase, to reuse the existing Stripe customer (optional)
- `stripe_portal`: Create a Stripe Customer Portal session and return its URL
  - `accessToken`: Access token received when the Stripe checkout session was created
  - `returnUrl`: URL to return the customer to after managing their subscription
- `stripe_purchases`: Get a customer's Stripe purchases using an access token
  - `accessToken`: Access token received when the Stripe checkout session was created

### App Management
- `iaptic_switch_app`: Switch to a different Iaptic app
  - `appName`: Name of the app to switch to
  - `apiKey`: API key for the app
- `iaptic_reset_app`: Reset to the default Iaptic app
- `iaptic_current_app`: Get information about the currently active app

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Requirements

- Node.js >= 18
- An Iaptic account with API credentials

## License

MIT 
