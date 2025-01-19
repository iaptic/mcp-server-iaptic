import { IapticAPI } from '../iaptic-api.js';

export class PurchaseTools {
  constructor(private api: IapticAPI) {}

  getTools() {
    return [
      {
        name: "purchase_list",
        description: `List purchases from your Iaptic account.
- Returns a paginated list of purchases
- Use limit and offset for pagination (default: 100 per page)
- Filter by date range using startdate and enddate (ISO format)
- Filter by customerId to see purchases from a specific customer
- Results include purchase status, product info, and transaction details
- Results are ordered by purchase date (newest first)`,
        inputSchema: {
          type: "object",
          properties: {
            limit: { 
              type: "number", 
              description: "Maximum number of purchases to return (default: 100, max: 1000)" 
            },
            offset: { 
              type: "number", 
              description: "Number of purchases to skip for pagination" 
            },
            startdate: { 
              type: "string", 
              description: "Filter purchases after this date (ISO format, e.g. 2024-01-01)" 
            },
            enddate: { 
              type: "string", 
              description: "Filter purchases before this date (ISO format, e.g. 2024-12-31)" 
            },
            customerId: { 
              type: "string", 
              description: "Filter purchases by customer ID" 
            }
          }
        }
      },
      {
        name: "purchase_get",
        description: `Get detailed information about a specific purchase.
- Returns complete purchase details including:
  - Product information
  - Purchase status
  - Associated transactions
  - Customer information
  - Subscription details (if applicable)
- Required: purchaseId parameter`,
        inputSchema: {
          type: "object",
          properties: {
            purchaseId: { 
              type: "string", 
              description: "Unique identifier of the purchase" 
            }
          },
          required: ["purchaseId"]
        }
      }
    ];
  }

  async handleTool(name: string, args: any) {
    switch (name) {
      case 'purchase_list':
        console.error(`Fetching purchases with params:`, args);
        const purchases = await this.api.getPurchases({
          limit: Math.min(args.limit || 100, 1000),  // Cap at 1000
          offset: args.offset,
          startdate: args.startdate,
          enddate: args.enddate,
          customerId: args.customerId
        });
        console.error(`Retrieved ${purchases.rows?.length || 0} purchases`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(purchases, null, 2)
          }]
        };

      case 'purchase_get':
        const purchase = await this.api.getPurchase(args.purchaseId);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(purchase, null, 2)
          }]
        };

      default:
        throw new Error(`Unknown purchase tool: ${name}`);
    }
  }
} 