import { calc } from '$lib/server';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
  const data = calc.exportAll();
  const date = (data.exportedAt ?? new Date().toISOString()).slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="cocktailcalc-${date}.json"`,
    },
  });
};
