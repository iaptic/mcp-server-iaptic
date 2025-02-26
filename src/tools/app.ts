import { IapticAPI } from '../iaptic-api.js';

export class AppTools {
  constructor(private api: IapticAPI) {}

  getTools() {
    return [
      {
        name: "iaptic_switch_app",
        description: `Switch to a different Iaptic app.
- Allows temporarily using a different app's credentials
- All subsequent API calls will use the new app name and API key
- Useful for managing multiple apps in the same session
- Required: appName and apiKey parameters`,
        inputSchema: {
          type: "object",
          properties: {
            appName: { 
              type: "string", 
              description: "Name of the app to switch to" 
            },
            apiKey: { 
              type: "string", 
              description: "API key for the app" 
            }
          },
          required: ["appName", "apiKey"]
        }
      },
      {
        name: "iaptic_reset_app",
        description: `Reset to the default Iaptic app.
- Reverts to the original app credentials provided during server initialization
- All subsequent API calls will use the default app name and API key
- Use this after using iaptic_switch_app to return to the default app`,
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "iaptic_current_app",
        description: `Get information about the currently active Iaptic app.
- Returns the current app name
- Indicates whether using default or custom credentials`,
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ];
  }

  async handleTool(name: string, args: any) {
    switch (name) {
      case 'iaptic_switch_app':
        this.api.switchApp(args.apiKey, args.appName);
        return {
          content: [{
            type: "text",
            text: `Successfully switched to app: ${args.appName}`
          }]
        };

      case 'iaptic_reset_app':
        this.api.resetToDefaultApp();
        return {
          content: [{
            type: "text",
            text: `Successfully reset to default app`
          }]
        };

      case 'iaptic_current_app':
        const appInfo = this.api.getCurrentAppInfo();
        return {
          content: [{
            type: "text",
            text: `Current app: ${appInfo.appName} (${appInfo.isDefault ? 'default' : 'custom'} credentials)`
          }]
        };

      default:
        throw new Error(`Unknown app tool: ${name}`);
    }
  }
}