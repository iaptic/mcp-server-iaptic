import axios, { AxiosError } from 'axios';

interface IapticErrorResponse {
  ok: false;
  status?: number;
  code?: string;
  message?: string;
}

interface ListParams {
  limit?: number;
  offset?: number;
  startdate?: string;  // ISO date string
  enddate?: string;    // ISO date string
}

export interface IapticEvent {
  tag: string;
  type: string;
  eventId: string;
  context: {
    appName: string;
    eventType: string;
    eventDate: string;
    eventDateMs?: number;
    applicationUsername?: string;
    req_id?: string;
    includeHeavyData?: boolean;
  };
  content: {
    purchases: Array<{
      platform: string;
      receiptId: string;
      purchaseId: string;
      productId: string;
    }>;
    transactions: Array<{
      productId: string;
      offerId: string | null;
      purchaseId: string;
      transactionId: string;
      sandbox: boolean;
      platform: string;
      purchaseDate: string;
      isPending: boolean;
      isConsumed: boolean;
      isAcknowledged: boolean;
      quantity: number;
      amountUSD: number | null;
      amountMicros: number | null;
      currency: string | null;
    }>;
    refreshFailures: Array<{
      platform: string;
      reason: string;
    }>;
    products: Array<{
      id: string;
      type: string;
      currency: string;
      offers: Array<{
        id: string;
        pricingPhases: Array<{
          priceMicros: number;
          currency: string;
        }>;
      }>;
    }>;
    exchangeRates: Array<any>;
    claims: Array<any>;
    notifications: Array<any>;
    tags: Record<string, string>;
  };
}

export class IapticAPI {
  private client;
  private appName: string;
  private apiKey: string;

  constructor(apiKey: string, appName: string) {
    this.appName = appName;
    this.apiKey = apiKey;
    
    // Create base64 encoded auth token from appName:apiKey
    const authToken = Buffer.from(`${appName}:${apiKey}`).toString('base64');

    this.client = axios.create({
      baseURL: 'https://validator.iaptic.com/v3',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor to log curl command
    this.client.interceptors.request.use(request => {
      const method = (request.method || 'GET').toUpperCase();
      const url = (request.baseURL || '') + (request.url || '');
      const headers = Object.entries(request.headers)
        .map(([key, value]) => `-H '${key}: ${value}'`)
        .join(' ');
      const data = request.data ? `-d '${JSON.stringify(request.data)}'` : '';
      const params = request.params ? 
        '?' + new URLSearchParams(request.params).toString() : '';
      
      console.error(`curl -X ${method} '${url}${params}' ${headers} ${data}`);
      return request;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError<IapticErrorResponse>) => {
        if (error.response?.data) {
          const { message, code, status } = error.response.data;
          throw new Error(`Iaptic API Error (${status || code}): ${message || 'Unknown error'}`);
        }
        throw error;
      }
    );
  }

  async getCustomers(params?: { limit?: number; offset?: number }) {
    const response = await this.client.get('/customers', { params });
    return response.data;
  }

  async getCustomer(customerId: string) {
    const response = await this.client.get(`/customers/${customerId}`);
    return response.data;
  }

  async getPurchases(params?: ListParams & { customerId?: string }) {
    const defaultParams = {
      limit: 100,  // Reasonable default limit
      ...params
    };
    const response = await this.client.get('/purchases', { params: defaultParams });
    return response.data;
  }

  async getPurchase(purchaseId: string) {
    const response = await this.client.get(`/purchases/${purchaseId}`);
    return response.data;
  }

  async getTransactions(params?: ListParams & { purchaseId?: string }) {
    const defaultParams = {
      limit: 100,  // Reasonable default limit
      ...params
    };
    const response = await this.client.get('/transactions', { params: defaultParams });
    return response.data;
  }

  async getTransaction(transactionId: string) {
    const response = await this.client.get(`/transactions/${transactionId}`);
    return response.data;
  }

  async getStats() {
    const response = await this.client.get('/stats');
    return response.data;
  }

  async getAppStats() {
    const response = await this.client.get(`/apps/${this.appName}/stats`);
    return response.data;
  }

  async validateReceipt(data: {
    id: string;
    type: string;
    transaction: any;
    additionalData?: {
      applicationUsername?: string;
    };
  }) {
    const response = await this.client.post('/validate', data);
    return response.data;
  }

  async getStripePrices() {
    const response = await this.client.get('/stripe/prices');
    return response.data;
  }

  async createStripeCheckout(data: {
    offerId: string;
    applicationUsername: string;
    successUrl: string;
    cancelUrl: string;
    mode?: 'payment' | 'subscription';
    accessToken?: string;
  }) {
    const response = await this.client.post('/stripe/checkout', data);
    return response.data;
  }

  async createStripePortal(data: {
    id: string;
    accessToken: string;
    returnUrl: string;
  }) {
    const response = await this.client.post('/stripe/portal', data);
    return response.data;
  }

  async getStripePurchases(params: { accessToken?: string }) {
    const response = await this.client.get('/stripe/purchases', { params });
    return response.data;
  }

  async getEvents(params?: ListParams) {
    const defaultParams = {
      ...params,
      appName: this.appName,
      apiKey: this.apiKey
    };
    const response = await this.client.get('/events', { params: defaultParams });
    
    // Format the response
    // if (response.data.ok && response.data.rows) {
      // console.log(formattedEvents);
    // }
    
    return response.data;
  }
} 