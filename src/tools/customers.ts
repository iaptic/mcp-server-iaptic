import { IapticAPI } from '../iaptic-api.js';

export class CustomerTools {
  constructor(private api: IapticAPI) {}

  getTools() {
    return [
      {
        name: "customer_list",
        description: `List customers from your Iaptic account.
- Returns a paginated list of customers with their purchase status
- Each customer includes:
  - Application username
  - Last purchase information
  - Subscription status (active/lapsed)
  - Renewal intent
  - Trial/introductory period status
- Use limit and offset for pagination (default: 100 customers per page)
- Results are ordered by creation date (newest first)`,
        inputSchema: {
          type: "object",
          properties: {
            limit: { 
              type: "number", 
              description: "Maximum number of customers to return (default: 100)" 
            },
            offset: { 
              type: "number", 
              description: "Number of customers to skip for pagination" 
            }
          }
        }
      },
      {
        name: "customer_get",
        description: `Get detailed information about a specific customer.
- Returns complete customer profile including:
  - Application username
  - Purchase history
  - Active and expired subscriptions
  - Last purchase details
  - Subscription renewal status
  - Trial and introductory period information
- Required: customerId parameter`,
        inputSchema: {
          type: "object",
          properties: {
            customerId: { 
              type: "string", 
              description: "Unique identifier of the customer" 
            }
          },
          required: ["customerId"]
        }
      },
      {
        name: "customer_add_purchase",
        description: `Manually associate a customer with a purchase.
- Links a purchase to a specific customer
- Takes priority over receipt validation links
- Useful for manual purchase management
- Purchase format should be "platform:purchaseId", for example apple:123109519983
- Required: customerId and purchaseId`,
        inputSchema: {
          type: "object",
          properties: {
            customerId: { 
              type: "string", 
              description: "Application username of the customer" 
            },
            purchaseId: { 
              type: "string", 
              description: "ID of the purchase to associate" 
            }
          },
          required: ["customerId", "purchaseId"]
        }
      },
      {
        name: "customer_subscription",
        description: `Get customer's subscription status.
- Returns active subscription details if any
- Includes:
  - Subscription status and expiry
  - Payment and renewal information
  - Trial/introductory period status
- Simpler alternative to customer_get for subscription-only apps`,
        inputSchema: {
          type: "object",
          properties: {
            customerId: { 
              type: "string", 
              description: "Application username of the customer" 
            }
          },
          required: ["customerId"]
        }
      },
      {
        name: "customer_transactions",
        description: `Get customer's transaction history.
- Returns list of all transactions
- Includes:
  - Payment details
  - Transaction status
  - Associated purchases
  - Timestamps`,
        inputSchema: {
          type: "object",
          properties: {
            customerId: { 
              type: "string", 
              description: "Application username of the customer" 
            }
          },
          required: ["customerId"]
        }
      }
    ];
  }

  async handleTool(name: string, args: any) {
    switch (name) {
      case 'customer_list':
        const customers = await this.api.getCustomers(args);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(customers, null, 2)
          }]
        };

      case 'customer_get':
        const customer = await this.api.getCustomer(args.customerId);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(customer, null, 2)
          }]
        };

      default:
        throw new Error(`Unknown customer tool: ${name}`);
    }
  }
} 