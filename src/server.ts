#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { parseArgs } from 'node:util';

// Load environment variables from .env file as fallback
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { IapticAPI } from "./iaptic-api.js";
import { CustomerTools } from "./tools/customers.js";
import { PurchaseTools } from "./tools/purchases.js";
import { TransactionTools } from "./tools/transactions.js";
import { StatisticsTools } from "./tools/statistics.js";
import { StripeTools } from "./tools/stripe.js";
import { EventTools } from "./tools/events.js";
import { AppTools } from "./tools/app.js";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      IAPTIC_API_KEY?: string;
      IAPTIC_APP_NAME?: string;
    }
  }
}

class IapticServer {
  private server: Server;
  private api: IapticAPI;
  private tools: {
    customers: CustomerTools;
    purchases: PurchaseTools;
    transactions: TransactionTools;
    statistics: StatisticsTools;
    stripe: StripeTools;
    events: EventTools;
    app: AppTools;
  };

  constructor(apiKey: string, appName: string) {
    console.error('Starting Iaptic MCP Server...');
    this.api = new IapticAPI(apiKey, appName);
    
    this.tools = {
      customers: new CustomerTools(this.api),
      purchases: new PurchaseTools(this.api),
      transactions: new TransactionTools(this.api),
      statistics: new StatisticsTools(this.api),
      stripe: new StripeTools(this.api),
      events: new EventTools(this.api),
      app: new AppTools(this.api)
    };

    this.server = new Server(
      { name: "iaptic-mcp-server", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          ...this.tools.customers.getTools(),
          ...this.tools.purchases.getTools(),
          ...this.tools.transactions.getTools(),
          ...this.tools.statistics.getTools(),
          ...this.tools.stripe.getTools(),
          ...this.tools.events.getTools(),
          ...this.tools.app.getTools()
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        // Route tool calls to appropriate handler
        if (name.startsWith('customer_')) {
          return await this.tools.customers.handleTool(name, args);
        }
        if (name.startsWith('purchase_')) {
          return await this.tools.purchases.handleTool(name, args);
        }
        if (name.startsWith('transaction_')) {
          return await this.tools.transactions.handleTool(name, args);
        }
        if (name.startsWith('stats_')) {
          return await this.tools.statistics.handleTool(name, args);
        }
        if (name.startsWith('stripe_')) {
          return await this.tools.stripe.handleTool(name, args);
        }
        if (name.startsWith('event_')) {
          return await this.tools.events.handleTool(name, args);
        }
        if (name.startsWith('iaptic_')) {
          return await this.tools.app.handleTool(name, args);
        }

        throw new Error(`Unknown tool: ${name}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Error handling tool ${name}:`, errorMessage);
        if (error instanceof Error && error.stack) {
          console.error(error.stack);
        }

        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${errorMessage}` }]
        };
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    console.error('Connecting to transport...');
    await this.server.connect(transport);
    console.error('Server ready!');
  }
}

// Parse command line arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'api-key': { type: 'string' },
    'app-name': { type: 'string' }
  }
});

// Get credentials from args or fallback to env vars
const apiKey = values['api-key'] || process.env.IAPTIC_API_KEY;
const appName = values['app-name'] || process.env.IAPTIC_APP_NAME;

if (!apiKey) {
  throw new Error("API key is required. Provide it via --api-key argument or IAPTIC_API_KEY environment variable");
}

if (!appName) {
  throw new Error("App name is required. Provide it via --app-name argument or IAPTIC_APP_NAME environment variable");
}

const server = new IapticServer(apiKey, appName);
server.start().catch(console.error); 