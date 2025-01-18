# MCP Server for Iaptic

A Model Context Protocol server for interacting with the [Iaptic API](https://www.iaptic.com). This server allows Claude or other AIs to interact with your Iaptic data to answer questions about your customers, purchases, transactions, and statistics.

<a href="https://glama.ai/mcp/servers/u2l6kenhz6"><img width="380" height="200" src="https://glama.ai/mcp/servers/u2l6kenhz6/badge" alt="Iaptic Server MCP server" /></a>

## Installation

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
