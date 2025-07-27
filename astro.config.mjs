import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/server';

export default defineConfig({
  output: 'server',       // Enable SSR build
  adapter: vercel(),      // Use Vercel Server adapter
  integrations: [react()]
});
