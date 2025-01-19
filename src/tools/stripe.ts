import { IapticAPI } from '../iaptic-api.js';

export class StripeTools {
  constructor(private api: IapticAPI) {}

  getTools() {
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
- Results are cached for 5 minutes`,
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ];
  }

  async handleTool(name: string, args: any) {
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
        const checkout = await this.api.createStripeCheckout(args);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(checkout, null, 2)
          }]
        };

      case 'stripe_portal':
        const portal = await this.api.createStripePortal(args);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(portal, null, 2)
          }]
        };

      case 'stripe_purchases':
        const purchases = await this.api.getStripePurchases(args);
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