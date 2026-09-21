import { error, json, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { NotFoundError } from './calc';

/** Parses and validates a JSON request body; responds with 400 on failure. */
export async function parseBody<T extends z.ZodType>(
  event: RequestEvent,
  schema: T,
): Promise<z.output<T>> {
  let raw: unknown;
  try {
    raw = await event.request.json();
  } catch {
    error(400, 'Invalid JSON body');
  }
  const result = schema.safeParse(raw);
  if (!result.success) error(400, z.prettifyError(result.error));
  return result.data;
}

/** Runs a service call and maps domain errors to HTTP responses. */
export function respond<T>(fn: () => T): Response {
  try {
    const value = fn();
    return value === undefined
      ? new Response(null, { status: 204 })
      : json(value);
  } catch (e) {
    if (e instanceof NotFoundError) error(404, e.message);
    if (e instanceof Error && /FOREIGN KEY constraint failed/.test(e.message)) {
      error(404, 'Referenced item does not exist');
    }
    throw e;
  }
}
