import { IapticAPI } from '../iaptic-api.js';

export class StatisticsTools {
  constructor(private api: IapticAPI) {}

  getTools() {
    return [
      {
        name: "stats_get",
        description: "Get statistics about transactions and revenue",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "stats_app",
        description: "Get app-specific statistics",
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