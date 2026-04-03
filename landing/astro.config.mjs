import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { SITE } from './src/consts';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

export default defineConfig({
  site: SITE.site,
  integrations: [mdx(), sitemap(), react()],
  redirects: {
    '/sitemap.xml': '/sitemap-index.xml'
  },
  vite: {
    plugins: [tailwindcss()],
  },
});