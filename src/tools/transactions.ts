import { IapticAPI } from '../iaptic-api.js';

export class TransactionTools {
  constructor(private api: IapticAPI) {}

  getTools() {
    return [
      {
        name: "transaction_list",
        description: `List financial transactions from your Iaptic account.
- Returns a paginated list of transactions
- Use limit and offset for pagination (default: 100 per page)
- Filter by date range using startdate and enddate (ISO format)
- Filter by purchaseId to see transactions for a specific purchase
- Results include transaction status, amount, currency, and payment details
- Results are ordered by transaction date (newest first)
- Important: Use date filtering to avoid retrieving too many records`,
        inputSchema: {
          type: "object",
          properties: {
            limit: { 
              type: "number", 
              description: "Maximum number of transactions to return (default: 100, max: 1000)" 
            },
            offset: { 
              type: "number", 
              description: "Number of transactions to skip for pagination" 
            },
            startdate: { 
              type: "string", 
              description: "Filter transactions after this date (ISO format, e.g. 2024-01-01)" 
            },
            enddate: { 
              type: "string", 
              description: "Filter transactions before this date (ISO format, e.g. 2024-12-31)" 
            },
            purchaseId: { 
              type: "string", 
              description: "Filter transactions by purchase ID" 
            }
          }
        }
      },
      {
        name: "transaction_get",
        description: `Get detailed information about a specific transaction.
- Returns complete transaction details including:
  - Transaction status
  - Amount and currency
  - Payment method details
  - Associated purchase information
  - Customer information
  - Timestamps and audit data
- Required: transactionId parameter`,
        inputSchema: {
          type: "object",
          properties: {
            transactionId: { 
              type: "string", 
              description: "Unique identifier of the transaction" 
            }
          },
          required: ["transactionId"]
        }
      }
    ];
  }

  async handleTool(name: string, args: any) {
    switch (name) {
      case 'transaction_list':
        console.error(`Fetching transactions with params:`, args);
        const transactions = await this.api.getTransactions({
          limit: Math.min(args.limit || 100, 1000),  // Cap at 1000
          offset: args.offset,
          startdate: args.startdate,
          enddate: args.enddate,
          purchaseId: args.purchaseId
        });
        console.error(`Retrieved ${transactions.rows?.length || 0} transactions`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(transactions, null, 2)
          }]
        };

      case 'transaction_get':
        const transaction = await this.api.getTransaction(args.transactionId);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(transaction, null, 2)
          }]
        };

      default:
        throw new Error(`Unknown transaction tool: ${name}`);
    }
  }
} 