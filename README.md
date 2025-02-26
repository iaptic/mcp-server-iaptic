# MCP Server for Iaptic
[![smithery badge](https://smithery.ai/badge/mcp-server-iaptic)](https://smithery.ai/server/mcp-server-iaptic)

A Model Context Protocol server for interacting with the [Iaptic API](https://www.iaptic.com). This server allows Claude or other AIs to interact with your Iaptic data to answer questions about your customers, purchases, transactions, and statistics.

## Installation

### Installing via Smithery

To install Iaptic for Claude Desktop automatically via [Smithery](https://smithery.ai/server/mcp-server-iaptic):

```bash
npx -y @smithery/cli install mcp-server-iaptic --client claude
```

### Manual Installation
```bash
# Run directly with npx
npx mcp-server-iaptic --api-key YOUR_API_KEY --app-name YOUR_APP_NAME

# Or install globally
npm install -g mcp-server-iaptic
mcp-server-iaptic --api-key YOUR_API_KEY --app-name YOUR_APP_NAME
```

## Usage with Claude Desktop

Add to your Claude Desktop configuration file:

```json
{
  "iaptic": {
    "command": "npx",
    "args": [
      "mcp-server-iaptic",
      "--api-key", "your-api-key-here",
      "--app-name", "your-app-name-here"
    ]
  }
}
```

## Available Tools

### Customers
- `customer_list`: List customers
- `customer_get`: Get customer details by ID

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
