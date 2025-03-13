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

export class StripeTools {
  constructor(private api: IapticAPI) {}

  getTools() {
    const appInfo = this.api.getCurrentAppInfo();
    const appNameRequired = appInfo.usingMasterKey;
    
    return [
      {
        name: "stripe_prices",
        description: `Get available Stripe products and prices.
- Returns list of products with their associated prices
- Each product includes:
  - Product ID and display name
  - Description and metadata
  - Available pricing offers
  - Subscription terms if applicable
- Results are cached for 5 minutes${appNameRequired ? '\n- Requires appName parameter when using master key' : ''}`,
        inputSchema: {
          type: "object",
          properties: {
            ...(appNameRequired ? {
              appName: {
                type: "string",
                description: "Name of the app to fetch data from. Required when using master key."
              }
            } : {})
          },
          required: appNameRequired ? ["appName"] : undefined
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
      case 'stripe_prices':
        const prices = await this.api.getStripePrices();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(prices, null, 2)
          }]
        };

      case 'stripe_checkout':
        const checkout = await this.api.createStripeCheckout({
          ...args,
          appName: args.appName
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify(checkout, null, 2)
          }]
        };

      case 'stripe_portal':
        const portal = await this.api.createStripePortal({
          ...args,
          appName: args.appName
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify(portal, null, 2)
          }]
        };

      case 'stripe_purchases':
        const purchases = await this.api.getStripePurchases({
          ...args,
          appName: args.appName
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify(purchases, null, 2)
          }]
        };

      default:
        throw new Error(`Unknown stripe tool: ${name}`);
    }
  }
} 