import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import net from 'net';

// Helper to check if AI health is OK
const checkAiHealth = async (baseUrl: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout for health check

    // Prefer /health if available, otherwise fallback to root or just check if it responds 200
    const healthUrl = baseUrl.endsWith('/') ? `${baseUrl}health` : `${baseUrl}/health`;

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // 1. Get explicitly configured URL or default
  let aiProxyTarget =
    env.VITE_AI_PROXY_TARGET ||
    env.AI_PROXY_TARGET ||
    env.VITE_API_PROXY_TARGET ||
    env.API_PROXY_TARGET ||
    env.VITE_AI_BASE_URL ||
    'http://localhost:3000'; // Default to try local first if nothing set

  const fallbackUrl = 'https://ai.seo-kim.com';

  // 2. Smart Detection Logic
  console.log('\n🔍 Starting AI Service Health Check...');

  let isValid = await checkAiHealth(aiProxyTarget);

  if (!isValid && (aiProxyTarget.includes('localhost') || aiProxyTarget.includes('127.0.0.1'))) {
    console.log(`⚠️  Local AI server failed health check at ${aiProxyTarget}`);
    console.log(`🚀 Switching to Backup Production Server: ${fallbackUrl}`);
    aiProxyTarget = fallbackUrl;
    isValid = await checkAiHealth(aiProxyTarget);
  }

  if (isValid) {
    console.log(`✅ Valid AI API found: ${aiProxyTarget}\n`);
  } else {
    console.log(`❌ No valid AI API available. Please check your configuration.\n`);
    // We still set it but the app will likely fail requests
  }

  return {
    server: {
      port: Number(env.VITE_PORT) || 5173,
      host: '0.0.0.0',
      proxy: aiProxyTarget
        ? {
          '/ai': { target: aiProxyTarget, changeOrigin: true, secure: false },
        }
        : undefined,
    },
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, '.') } },
    envPrefix: ['VITE_', 'AI_'],
  };
});
