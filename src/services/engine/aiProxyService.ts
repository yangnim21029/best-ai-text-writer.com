import { NextRequest, NextResponse } from 'next/server';

export class AIProxyService {
  private static aiBaseUrl = process.env.AI_BASE_URL || 'http://localhost:3000';
  private static aiToken = process.env.AI_TOKEN;
  private static proxySecret = process.env.AI_PROXY_SECRET;

  /**
   * Validates if the request is authorized to use the proxy
   */
  static isAuthorized(request: NextRequest): boolean {
    // If no secret is configured, we allow for now but warn (not recommended for production)
    if (!this.proxySecret) {
      console.warn('[AIProxyService] AI_PROXY_SECRET is not configured. Proxy is UNPROTECTED.');
      return true;
    }

    const authHeader = request.headers.get('x-ai-proxy-secret');
    return authHeader === this.proxySecret;
  }

  /**
   * Proxies a POST request to the target AI service
   */
  static async handlePost(request: NextRequest, path: string[]) {
    if (!this.isAuthorized(request)) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Unauthorized proxy request' }, { status: 401 });
    }

    const joinedPath = path.join('/');
    const body = await request.json();
    const targetUrl = `${this.aiBaseUrl.replace(/\/$/, '')}/${joinedPath}`;

    console.log(`[AIProxyService] Proxying POST to ${targetUrl}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.aiToken) {
      headers['Authorization'] = `Bearer ${this.aiToken}`;
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      return await this.forwardResponse(response, targetUrl);
    } catch (error: any) {
      return this.handleError(error, targetUrl);
    }
  }

  /**
   * Proxies a GET request to the target AI service
   */
  static async handleGet(request: NextRequest, path: string[]) {
    if (!this.isAuthorized(request)) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Unauthorized proxy request' }, { status: 401 });
    }

    const joinedPath = path.join('/');
    const targetUrl = `${this.aiBaseUrl.replace(/\/$/, '')}/${joinedPath}`;

    console.log(`[AIProxyService] Proxying GET to ${targetUrl}`);

    try {
      const response = await fetch(targetUrl);
      return await this.forwardResponse(response, targetUrl);
    } catch (error: any) {
      return this.handleError(error, targetUrl);
    }
  }

  private static async forwardResponse(response: Response, targetUrl: string) {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    const text = await response.text();
    if (!response.ok) {
      console.warn(`[AIProxyService] Non-OK response from ${targetUrl}:`, text.substring(0, 200));
    }

    return new NextResponse(text, {
      status: response.status,
      headers: { 'Content-Type': contentType || 'text/plain' },
    });
  }

  private static handleError(error: any, targetUrl: string) {
    console.error(`[AIProxyService] Error proxying to ${targetUrl}:`, error);
    return NextResponse.json(
      { 
        error: 'PROXY_FAILED', 
        message: 'Failed to proxy request to AI service', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
