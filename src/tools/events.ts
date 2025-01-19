import { IapticAPI, IapticEvent } from '../iaptic-api.js';

export class EventTools {
  constructor(private api: IapticAPI) {}

  getTools() {
    return [
      {
        name: "event_list",
        description: `List recent events from your Iaptic account.
- Returns a paginated list of system events
- Events include:
  - Receipt validations
  - Platform notifications (Apple/Google/etc)
  - Webhook deliveries
  - Purchase status changes
  - Subscription renewals
- Use limit and offset for pagination
- Results ordered by date (newest first)`,
        inputSchema: {
          type: "object",
          properties: {
            limit: { 
              type: "number", 
              description: "Maximum number of events to return (default: 100)" 
            },
            offset: { 
              type: "number", 
              description: "Number of events to skip for pagination" 
            },
            startdate: {
              type: "string",
              description: "Filter events after this date (ISO format, e.g. 2024-01-01)"
            },
            enddate: {
              type: "string",
              description: "Filter events before this date (ISO format, e.g. 2024-12-31)"
            }
          }
        }
      }
    ];
  }

  async handleTool(name: string, args: any) {
    switch (name) {
      case 'event_list':
        console.error(`Fetching events with params:`, args);
        const events = await this.api.getEvents(args);
        console.error(`Retrieved ${events.rows?.length || 0} events`);
        const formattedEvents = events.rows.slice(0,20).map(formatEvent).join('\n');
        console.error(formattedEvents);
        return {
          content: [{
            type: "text",
            text: formattedEvents
          }]
        };

      default:
        throw new Error(`Unknown event tool: ${name}`);
    }
  }
} 

function formatEvent(event: IapticEvent): string {
  const { context, content } = event;
  const { transactions, products, refreshFailures } = content;
  
  // Start with basic event info
  let output = `### ${new Date(context.eventDate).toLocaleString()}: ${context.eventType} by ${context.applicationUsername || 'system'}`;

  // Add refresh failures if present
  if (refreshFailures?.length > 0) {
    output += '\nRefresh Failures:';
    output += refreshFailures.map(f => `\n  ${f.platform}: ${f.reason}`).join('');
  }

  // Format transaction info with more details
  if (transactions?.length > 0) {
    output += '\nTransactions:';
    output += transactions.map(t => 
      `\n  ${t.transactionId}: ${t.productId}${t.amountMicros ? ` (${(t.amountMicros/1000000).toFixed(2)} ${t.currency})` : ''}`
      + `${t.sandbox ? ' [SANDBOX]' : ''}`
      + `${t.isConsumed ? ' [CONSUMED]' : ''}`
      + `${t.isAcknowledged ? ' [ACKNOWLEDGED]' : ''}`
    ).join('');
  }

  // Add product info if present
  if (products?.length > 0) {
    output += '\nProducts:';
    output += products.map(p => 
      `\n  ${p.id} (${p.type})${p.offers?.[0]?.pricingPhases?.[0]?.priceMicros ? 
        ` - ${(p.offers[0].pricingPhases[0].priceMicros/1000000).toFixed(2)} ${p.currency}` : ''}`
    ).join('');
  }

  return output;
}
