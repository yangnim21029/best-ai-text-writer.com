import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const aiProxyTarget =
    env.VITE_AI_PROXY_TARGET ||
    env.AI_PROXY_TARGET ||
    env.VITE_API_PROXY_TARGET ||
    env.API_PROXY_TARGET ||
    env.VITE_AI_BASE_URL ||
    '';

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
