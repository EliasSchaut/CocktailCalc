import { calc } from '$lib/server';
import { parseBody, respond } from '$lib/server/http';
import { DataExportBody } from '$lib/server/validation';
import type { RequestHandler } from './$types';

/** POST /api/import?mode=merge|replace */
export const POST: RequestHandler = async (event) => {
  const data = await parseBody(event, DataExportBody);
  const replace = event.url.searchParams.get('mode') === 'replace';
  return respond(() => calc.importAll(data, replace));
};
