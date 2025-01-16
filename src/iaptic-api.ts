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

export class IapticAPI {
  private client;
  private appName: string;

  constructor(apiKey: string, appName: string) {
    this.appName = appName;
    
    // Create base64 encoded auth token from appName:apiKey
    const authToken = Buffer.from(`${appName}:${apiKey}`).toString('base64');

    this.client = axios.create({
      baseURL: 'https://validator.iaptic.com/v3',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
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
} 