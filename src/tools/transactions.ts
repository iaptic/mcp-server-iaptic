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

export class TransactionTools {
  constructor(private api: IapticAPI) {}

  getTools() {
    const appInfo = this.api.getCurrentAppInfo();
    const appNameRequired = appInfo.usingMasterKey;
    
    return [
      {
        name: "transaction_list",
        description: `List financial transactions from your Iaptic account.
- Returns a paginated list of transactions
- Use limit and offset for pagination (default: 100 per page)
- Filter by date range using startdate and enddate (ISO format)
- Filter by purchaseId to see transactions for a specific purchase
- Results include transaction status, amount, currency, and payment details
- Results are ordered by transaction date (newest first)
- Important: Use date filtering to avoid retrieving too many records${appNameRequired ? '\n- Requires appName parameter when using master key' : ''}`,
        inputSchema: {
          type: "object",
          properties: {
            limit: { 
              type: "number", 
              description: "Maximum number of transactions to return (default: 100, max: 1000)" 
            },
            offset: { 
              type: "number", 
              description: "Number of transactions to skip for pagination" 
            },
            startdate: { 
              type: "string", 
              description: "Filter transactions after this date (ISO format, e.g. 2024-01-01)" 
            },
            enddate: { 
              type: "string", 
              description: "Filter transactions before this date (ISO format, e.g. 2024-12-31)" 
            },
            purchaseId: { 
              type: "string", 
              description: "Filter transactions by purchase ID" 
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
        name: "transaction_get",
        description: `Get detailed information about a specific transaction.
- Returns complete transaction details including:
  - Transaction status
  - Amount and currency
  - Payment method details
  - Associated purchase information
  - Customer information
  - Timestamps and audit data
- Required: transactionId parameter${appNameRequired ? '\n- Requires appName parameter when using master key' : ''}`,
        inputSchema: {
          type: "object",
          properties: {
            transactionId: { 
              type: "string", 
              description: "Unique identifier of the transaction" 
            },
            ...(appNameRequired ? {
              appName: {
                type: "string",
                description: "Name of the app to fetch data from. Required when using master key."
              }
            } : {})
          },
          required: appNameRequired ? ["transactionId", "appName"] : ["transactionId"]
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
      case 'transaction_list':
        console.error(`Fetching transactions with params:`, args);
        const transactions = await this.api.getTransactions({
          limit: Math.min(args.limit || 100, 1000),  // Cap at 1000
          offset: args.offset,
          startdate: args.startdate,
          enddate: args.enddate,
          purchaseId: args.purchaseId,
          appName: args.appName
        });
        console.error(`Retrieved ${transactions.rows?.length || 0} transactions`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(transactions, null, 2)
          }]
        };

      case 'transaction_get':
        const transaction = await this.api.getTransaction(args.transactionId, { appName: args.appName });
        return {
          content: [{
            type: "text",
            text: JSON.stringify(transaction, null, 2)
          }]
        };

      default:
        throw new Error(`Unknown transaction tool: ${name}`);
    }
  }
} 