import axios from 'axios';

class WalmartAPI {
  private clientId: string;
  private clientSecret: string;
  private baseURL: string = 'https://sandbox.walmartapis.com/api-proxy/service';
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.clientId = process.env.WALMART_CLIENT_ID!;
    this.clientSecret = process.env.WALMART_CLIENT_SECRET!;
  }

  private async getAccessToken() {
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    try {
      const response = await axios.post(
        'https://sandbox.walmartapis.com/api-proxy/service/token',
        {},
        {
          headers: {
            'WM_QOS.CLIENT_ID': this.clientId,
            'WM_QOS.AUTH_SIGNATURE': this.clientSecret,
            'WM_SVC.NAME': 'Walmart Marketplace',
            'WM_SVC.VERSION': '1.0.0',
          },
        }
      );

      this.token = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
      return this.token;
    } catch (error) {
      console.error('Error getting Walmart access token:', error);
      throw error;
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, unknown> = {}, useMockData: boolean = true) {
    await this.getAccessToken();
    try {
      // Add /dataset to the endpoint if using mock data
      const mockEndpoint = useMockData ? `${endpoint}/dataset` : endpoint;
      
      const response = await axios.get(`${this.baseURL}${mockEndpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'WM_QOS.CLIENT_ID': this.clientId,
          'WM_SVC.NAME': 'Walmart Marketplace',
          'Accept': 'application/json',
        },
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Error making Walmart API request:', error);
      throw error;
    }
  }

  async searchProducts(query: string, limit: number = 10, useMockData: boolean = true) {
    return this.makeRequest('/v3/search', {
      query,
      numItems: limit,
    }, useMockData);
  }

  async getProductDetails(productId: string, useMockData: boolean = true) {
    return this.makeRequest(`/v3/items/${productId}`, {}, useMockData);
  }

  async getProductRecommendations(productId: string, useMockData: boolean = true) {
    return this.makeRequest(`/v3/items/${productId}/recommendations`, {}, useMockData);
  }

  // Test the sandbox connection
  async testConnection() {
    try {
      await this.getAccessToken();
      return {
        success: true,
        message: 'Successfully connected to Walmart Sandbox API'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to connect to Walmart Sandbox API',
        error: error
      };
    }
  }
}

// Create and export a singleton instance
export const walmartAPI = new WalmartAPI(); 