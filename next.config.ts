import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    experimental: {
        // any experimental features can go here
    },
    // Ensure that we can access the AI proxy routes
    async rewrites() {
        return [
            // We will implement API routes for this instead if possible, 
            // but if we want to keep the same /ai path, we can rewrite it.
            // For now, let's keep it flexible.
        ];
    },
};

export default nextConfig;
