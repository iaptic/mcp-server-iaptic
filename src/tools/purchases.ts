import { IapticAPI } from '../iaptic-api.js';

interface SchemaProperties {
  [key: string]: {
    type: string;
    description: string;
  };
}

interface InputSchema {
  type: string;
  properties: SchemaProperties;
  required?: string[];
}

export class PurchaseTools {
  constructor(private api: IapticAPI) {}

  getTools() {
    const appInfo = this.api.getCurrentAppInfo();
    const appNameRequired = appInfo.usingMasterKey;
    
    return [
      {
        name: "purchase_list",
        description: `List purchases from your Iaptic account.
- Returns a paginated list of purchases
- Use limit and offset for pagination (default: 100 per page)
- Filter by date range using startdate and enddate (ISO format)
- Filter by customerId to see purchases from a specific customer
- Results include purchase status, product info, and transaction details
- Results are ordered by purchase date (newest first)${appNameRequired ? '\n- Requires appName parameter when using master key' : ''}`,
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
            },
            ...(appNameRequired ? {
              appName: {
                type: "string",
                description: "Name of the app to fetch data from. Required when using master key."
              }
            } : {})
          },
          required: appNameRequired ? ["appName"] : undefined
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
- Required: purchaseId parameter${appNameRequired ? '\n- Requires appName parameter when using master key' : ''}`,
        inputSchema: {
          type: "object",
          properties: {
            purchaseId: { 
              type: "string", 
              description: "Unique identifier of the purchase" 
            },
            ...(appNameRequired ? {
              appName: {
                type: "string",
                description: "Name of the app to fetch data from. Required when using master key."
              }
            } : {})
          },
          required: appNameRequired ? ["purchaseId", "appName"] : ["purchaseId"]
        }
      }
    ];
  }

  async handleTool(name: string, args: any) {
    const appInfo = this.api.getCurrentAppInfo();
    
    // If using master key and appName is provided, temporarily switch app
    if (appInfo.usingMasterKey && args.appName) {
      const currentApp = appInfo.appName;
      
      // Switch to the requested app
      this.api.switchApp('dummy-api-key', args.appName);
      
      try {
        // Execute the tool with the requested app
        const result = await this._handleTool(name, args);
        
        // Switch back to the original app
        this.api.switchApp('dummy-api-key', currentApp);
        
        return result;
      } catch (error) {
        // Make sure to switch back even if there's an error
        this.api.switchApp('dummy-api-key', currentApp);
        throw error;
      }
    }
    
    return this._handleTool(name, args);
  }
  
  // Internal method to handle the tool after any app switching
  private async _handleTool(name: string, args: any) {
    switch (name) {
      case 'purchase_list':
        console.error(`Fetching purchases with params:`, args);
        const purchases = await this.api.getPurchases({
          limit: Math.min(args.limit || 100, 1000),  // Cap at 1000
          offset: args.offset,
          startdate: args.startdate,
          enddate: args.enddate,
          customerId: args.customerId,
          appName: args.appName
        });
        console.error(`Retrieved ${purchases.rows?.length || 0} purchases`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(purchases, null, 2)
          }]
        };

      case 'purchase_get':
        const purchase = await this.api.getPurchase(args.purchaseId, { appName: args.appName });
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