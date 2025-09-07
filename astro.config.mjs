import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import path from 'path';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ellinet13.com',
  output: 'server',       // Enable SSR build
  adapter: vercel(),      // Use Vercel Server adapter
  integrations: [react(), sitemap()],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },

    plugins: [tailwindcss()],
  },
});