


export interface TruthArchiveClientOptions {
  baseUrl: string;
  apiKey?: string;
}

export interface Claim {
  id: string;
  text: string;
  source: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  claims: Claim[];
  total: number;
  query: string;
}

export class TruthArchiveClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(options: TruthArchiveClientOptions) {
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
  }

  async search(query: string, limit: number = 10): Promise<SearchResult> {
    return this.request('/search', {
      method: 'POST',
      body: JSON.stringify({ query, limit })
    });
  }

  async addClaim(claim: Omit<Claim, 'id'>): Promise<Claim> {
    return this.request('/claims', {
      method: 'POST',
      body: JSON.stringify(claim)
    });
  }

  async getClaim(id: string): Promise<Claim> {
    return this.request(`/claims/${id}`);
  }

  async healthCheck(): Promise<any> {
    return this.request('/health');
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Truth Archive API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export default TruthArchiveClient;


