import { KeywordData } from '../../types';

interface NlpResponse {
  status: string;
  data: {
    tokens: string[];
    frequencies: {
      token: string;
      count: number;
    }[];
  };
}

export const analyzeText = async (text: string): Promise<KeywordData[]> => {
  if (!text || text.trim().length === 0) return [];

  // External NLP API Endpoint
  const TARGET_URL = 'https://nlp.award-seo.com/api/v1/tokenize';
  // CORS Proxy to bypass browser restrictions
  const PROXY_URL = 'https://corsproxy.io/?';

  try {
    const response = await fetch(PROXY_URL + encodeURIComponent(TARGET_URL), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        min_length: 2,
        stop_words: [] // Empty array as per requirement, can be populated if needed
      }),
    });

    if (!response.ok) {
      console.warn('NLP API Error:', response.status, response.statusText);
      return [];
    }

    const json: NlpResponse = await response.json();

    if (json.status === 'ok' && json.data && json.data.frequencies) {
      // Sort by count descending to get high-frequency words first
      // Filter out 1-character tokens generally, though API min_length handles most
      return json.data.frequencies
        .filter(f => f.token.length > 1)
        .sort((a, b) => b.count - a.count);
    }

    return [];
  } catch (error) {
    console.error("NLP Service Error:", error);
    return [];
  }
};
