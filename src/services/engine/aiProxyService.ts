import { NextRequest, NextResponse } from 'next/server';
import { serverEnv, getProxySecret } from '../../config/env';

export class AIProxyService {
  private static aiBaseUrl = serverEnv.AI_BASE_URL;
  private static aiToken = serverEnv.AI_TOKEN;
  private static proxySecret = getProxySecret();

  /**
   * Validates if the request is authorized to use the proxy.
   * Allows either a shared secret header OR an active session cookie.
   */
  static isAuthorized(request: NextRequest): boolean {
    // 1. Check for shared secret (useful for non-browser clients)
    const authHeader = request.headers.get('x-ai-proxy-secret');
    if (this.proxySecret && authHeader === this.proxySecret) {
      return true;
    }

    // 2. Check for browser session (app_access_granted cookie)
    if (request.cookies.has('app_access_granted')) {
      return true;
    }

    // 3. Dev Mode Bypass (Localhost only)
    if (process.env.NODE_ENV === 'development') {
      console.warn('Dev Warning: Bypassing authentication for localhost development environment.');
      return true;
    }

    // Debugging: Log why we are rejecting
    console.error(`Authentication Failed: Missing or invalid credentials. Header present: ${!!authHeader}, Valid Secret: ${authHeader === this.proxySecret}, Cookie present: ${request.cookies.has('app_access_granted')}`);

    // Fail Closed: If neither is present, reject the request.
    return false;
  }

  /**
   * Proxies a POST request to the target AI service
   */
  static async handlePost(request: NextRequest, path: string[]) {
    // 1. Generate ID for tracing
    const requestId = crypto.randomUUID().slice(0, 8);

    if (!this.isAuthorized(request)) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Unauthorized proxy request' }, { status: 401 });
    }

    const joinedPath = path.join('/');
    const targetUrl = `${this.aiBaseUrl.replace(/\/$/, '')}/${joinedPath}`;

    try {
      // 2. Parse inside try/catch for safety and loose typing
      const body = await request.json() as Record<string, any>;

      const taskLabel = body?.promptId || 'unnamed_task';
      const model = body?.model || 'unknown_model';

      // 3. Log with Request ID
      console.log(`AI Request: Starting task "${taskLabel}" using model "${model}"...`);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      };

      if (this.aiToken) {
        headers['Authorization'] = `Bearer ${this.aiToken}`;
      }

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      return await this.forwardResponse(response, targetUrl, requestId);
    } catch (error: any) {
      return this.handleError(error, targetUrl, requestId);
    }
  }

  /**
   * Proxies a GET request to the target AI service
   */
  static async handleGet(request: NextRequest, path: string[]) {
    const requestId = crypto.randomUUID().slice(0, 8);

    if (!this.isAuthorized(request)) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Unauthorized proxy request' }, { status: 401 });
    }

    const joinedPath = path.join('/');
    const targetUrl = `${this.aiBaseUrl.replace(/\/$/, '')}/${joinedPath}`;

    console.log(`AI Request: Fetching data from external service...`);

    try {
      const response = await fetch(targetUrl);
      return await this.forwardResponse(response, targetUrl, requestId);
    } catch (error: any) {
      return this.handleError(error, targetUrl, requestId);
    }
  }

  private static async forwardResponse(response: Response, targetUrl: string, requestId: string) {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    const text = await response.text();
    if (!response.ok) {
      console.warn(
        `AI Warning: Received error response from AI service [${response.status}]:`,
        text.substring(0, 500)
      );
    }

    return new NextResponse(text, {
      status: response.status,
      headers: { 'Content-Type': contentType || 'text/plain' },
    });
  }

  private static handleError(error: any, targetUrl: string, requestId: string) {
    console.error(`AI Error: Failed to communicate with AI service:`, error);
    return NextResponse.json(
      {
        error: 'PROXY_FAILED',
        message: 'Failed to proxy request to AI service',
        details: error.message,
        requestId
      },
      { status: 500 }
    );
  }
}