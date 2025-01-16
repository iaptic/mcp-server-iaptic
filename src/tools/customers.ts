import { IapticAPI } from '../iaptic-api.js';

export class CustomerTools {
  constructor(private api: IapticAPI) {}

  getTools() {
    return [
      {
        name: "customer_list",
        description: "List all customers with pagination support",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Number of customers to return" },
            offset: { type: "number", description: "Offset for pagination" }
          }
        }
      },
      {
        name: "customer_get",
        description: "Get detailed information about a specific customer",
        inputSchema: {
          type: "object",
          properties: {
            customerId: { type: "string", description: "ID of the customer" }
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