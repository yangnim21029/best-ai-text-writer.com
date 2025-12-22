export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
}

export const withTimeoutAndValidation = async (
  url: string,
  options: FetchOptions = {}
): Promise<Response> => {
  const { timeoutMs = 30000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
};

export const fetchWithRetry = async (
  url: string,
  options: FetchOptions = {},
  retries: number = 2,
  delayMs: number = 1000
): Promise<Response> => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Retry on 5xx errors or 429 (Too Many Requests)
      if (attempt < retries && (response.status >= 500 || response.status === 429)) {
        const wait = delayMs * Math.pow(2, attempt);
        console.warn(`[fetchWithRetry] Attempt ${attempt + 1} failed with ${response.status}. Retrying in ${wait}ms...`);
        await new Promise((resolve) => setTimeout(resolve, wait));
        continue;
      }

      return response;
    } catch (error: any) {
      lastError = error;
      if (attempt < retries) {
        const wait = delayMs * Math.pow(2, attempt);
        console.warn(`[fetchWithRetry] Attempt ${attempt + 1} failed with network error. Retrying in ${wait}ms...`, error.message);
        await new Promise((resolve) => setTimeout(resolve, wait));
        continue;
      }
    }
  }

  throw lastError || new Error(`Failed to fetch after ${retries} retries`);
};
