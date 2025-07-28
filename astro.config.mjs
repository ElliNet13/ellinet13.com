import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'server',       // Enable SSR build
  adapter: vercel(),      // Use Vercel Server adapter
  integrations: [react(), sitemap()]
});