/**
 * This module provides mock implementations for Google Authentication
 * to be used on the client side when the real Google Auth library causes issues
 */

class MockGoogleAuth {
  private static instance: MockGoogleAuth;
  private token: string | null = null;
  
  private constructor() {
    // Private constructor for singleton
    this.token = localStorage.getItem('mock_auth_token') || null;
  }
  
  static getInstance(): MockGoogleAuth {
    if (!MockGoogleAuth.instance) {
      MockGoogleAuth.instance = new MockGoogleAuth();
    }
    return MockGoogleAuth.instance;
  }
  
  async getToken(): Promise<string | null> {
    return this.token;
  }
  
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('mock_auth_token', token);
  }
  
  clearToken(): void {
    this.token = null;
    localStorage.removeItem('mock_auth_token');
  }
  
  isAuthorized(): boolean {
    return !!this.token;
  }
}

export const mockGoogleAuth = MockGoogleAuth.getInstance(); 