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

export class StatisticsTools {
  constructor(private api: IapticAPI) {}

  getTools() {
    const appInfo = this.api.getCurrentAppInfo();
    const appNameRequired = appInfo.usingMasterKey;
    
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
- Data is aggregated across all your applications${appNameRequired ? '\n- Requires appName parameter when using master key' : ''}`,
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
        name: "stats_app",
        description: `Get statistics specific to your application.
- Returns app-specific metrics including:
  - App revenue and growth
  - Active subscriptions for this app
  - Customer metrics for this app
  - Product performance statistics
  - Transaction metrics
- Uses the app name provided during server initialization${appNameRequired ? '\n- Requires appName parameter when using master key' : ''}`,
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
      case 'stats_get':
        const stats = await this.api.getStats({ appName: args.appName });
        return {
          content: [{
            type: "text",
            text: JSON.stringify(stats, null, 2)
          }]
        };

      case 'stats_app':
        const appStats = await this.api.getAppStats({ appName: args.appName });
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