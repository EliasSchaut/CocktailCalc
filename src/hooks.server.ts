import type { Handle } from '@sveltejs/kit';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const handle: Handle = async ({ event, resolve }) => {
  const isApi = event.url.pathname.startsWith('/api');

  // CORS pre-flight for the Tauri shell and other external clients
  if (isApi && event.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const response = await resolve(event);

  if (isApi) {
    for (const [k, v] of Object.entries(CORS_HEADERS))
      response.headers.set(k, v);
  } else {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  return response;
};
