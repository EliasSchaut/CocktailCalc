import adapterNode from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const isTauri = process.env.BUILD_TARGET === 'tauri';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: isTauri
      ? adapterStatic({ fallback: 'index.html', strict: false })
      : adapterNode(),
  },
};

export default config;
