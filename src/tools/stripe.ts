import { IapticAPI } from '../iaptic-api.js';

interface SchemaProperties {
  [key: string]: {
    type: string;
    description: string;
    enum?: string[];
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
      },
      {
        name: "stripe_checkout",
        description: `Create a Stripe Checkout session and return its payment link.
- Use the offerId from stripe_prices (format 'stripe:<product_id>#<price_id>' or 'stripe:<price_id>')
- Returns a sessionId, a url where the customer completes payment, and an accessToken
- The accessToken can be reused: pass it back here to reuse the existing Stripe customer, or to stripe_purchases / stripe_portal
- Creates a Stripe payment session only — it does not modify any Iaptic data${appNameRequired ? '\n- Requires appName parameter when using master key' : ''}`,
        inputSchema: {
          type: "object",
          properties: {
            offerId: {
              type: "string",
              description: "Offer ID to purchase, as returned by the stripe_prices tool"
            },
            applicationUsername: {
              type: "string",
              description: "User identifier in your application"
            },
            successUrl: {
              type: "string",
              description: "URL to redirect the customer to after successful payment"
            },
            cancelUrl: {
              type: "string",
              description: "URL to redirect the customer to if they cancel"
            },
            mode: {
              type: "string",
              enum: ["payment", "subscription"],
              description: "Payment mode. Defaults to 'subscription' for recurring prices, 'payment' otherwise"
            },
            accessToken: {
              type: "string",
              description: "Optional access token from a previous purchase, to reuse the existing Stripe customer"
            },
            ...(appNameRequired ? {
              appName: {
                type: "string",
                description: "Name of the app to create the checkout session for. Required when using master key."
              }
            } : {})
          },
          required: appNameRequired ? ["offerId", "successUrl", "cancelUrl", "appName"] : ["offerId", "successUrl", "cancelUrl"]
        }
      },
      {
        name: "stripe_portal",
        description: `Create a Stripe Customer Portal session and return its URL.
- The customer manages their subscription there (update card, cancel, etc.)
- Requires the accessToken returned when the Stripe checkout session was created
- Creates a Stripe portal session only — it does not modify any Iaptic data${appNameRequired ? '\n- Requires appName parameter when using master key' : ''}`,
        inputSchema: {
          type: "object",
          properties: {
            accessToken: {
              type: "string",
              description: "Access token received when the Stripe checkout session was created"
            },
            returnUrl: {
              type: "string",
              description: "URL to return the customer to after they finish managing their subscription"
            },
            ...(appNameRequired ? {
              appName: {
                type: "string",
                description: "Name of the app to create the portal session for. Required when using master key."
              }
            } : {})
          },
          required: appNameRequired ? ["accessToken", "returnUrl", "appName"] : ["accessToken", "returnUrl"]
        }
      },
      {
        name: "stripe_purchases",
        description: `Get a customer's Stripe purchases using an access token.
- Requires the accessToken returned when the Stripe checkout session was created (see stripe_checkout)
- Returns the customer's purchases (subscriptions and payments) in the standard purchase format
- Also returns a newAccessToken to use for subsequent queries${appNameRequired ? '\n- Requires appName parameter when using master key' : ''}`,
        inputSchema: {
          type: "object",
          properties: {
            accessToken: {
              type: "string",
              description: "Access token received when the Stripe checkout session was created"
            },
            ...(appNameRequired ? {
              appName: {
                type: "string",
                description: "Name of the app to fetch data from. Required when using master key."
              }
            } : {})
          },
          required: appNameRequired ? ["accessToken", "appName"] : ["accessToken"]
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