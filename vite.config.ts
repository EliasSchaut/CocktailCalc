import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const isTauri = env.BUILD_TARGET === 'tauri';

  return {
    plugins: [tailwindcss(), sveltekit()],
    define: {
      __TAURI_BUILD__: JSON.stringify(isTauri),
      // Base URL of the API. Empty = same origin (web build).
      __API_BASE__: JSON.stringify(
        (env.PUBLIC_API_BASE ?? '').replace(/\/$/, ''),
      ),
    },
    server: {
      port: Number(env.FRONTEND_PORT ?? 5173),
      strictPort: isTauri,
    },
    test: {
      include: ['src/**/*.test.ts'],
      environment: 'node',
    },
  };
});
