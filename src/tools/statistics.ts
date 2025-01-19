import { IapticAPI } from '../iaptic-api.js';

export class StatisticsTools {
  constructor(private api: IapticAPI) {}

  getTools() {
    return [
      {
        name: "stats_get",
        description: `Get general transactions, revenue and usage statistics from your Iaptic account.
- Returns aggregated metrics including:
  - Total revenue
  - Number of active subscriptions
  - Customer growth metrics
  - Transaction success rates
  - Revenue by product type
- Data is aggregated across all your applications`,
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "stats_app",
        description: `Get statistics specific to your application.
- Returns app-specific metrics including:
  - App revenue and growth
  - Active subscriptions for this app
  - Customer metrics for this app
  - Product performance statistics
  - Transaction metrics
- Uses the app name provided during server initialization`,
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ];
  }

  async handleTool(name: string, args: any) {
    switch (name) {
      case 'stats_get':
        const stats = await this.api.getStats();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(stats, null, 2)
          }]
        };

      case 'stats_app':
        const appStats = await this.api.getAppStats();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(appStats, null, 2)
          }]
        };

      default:
        throw new Error(`Unknown statistics tool: ${name}`);
    }
  }
} 