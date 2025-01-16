import { IapticAPI } from '../iaptic-api.js';

export class TransactionTools {
  constructor(private api: IapticAPI) {}

  getTools() {
    return [
      {
        name: "transaction_list",
        description: "List transactions with pagination and date filtering",
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
              description: "Filter by purchase ID" 
            }
          }
        }
      },
      {
        name: "transaction_get",
        description: "Get detailed information about a specific transaction",
        inputSchema: {
          type: "object",
          properties: {
            transactionId: { type: "string", description: "ID of the transaction" }
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