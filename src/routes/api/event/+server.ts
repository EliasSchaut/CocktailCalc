import { calc } from '$lib/server';
import { parseBody, respond } from '$lib/server/http';
import { NameBody } from '$lib/server/validation';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  const { name } = await parseBody(event, NameBody);
  return respond(() => calc.addEvent(name));
};

export const DELETE: RequestHandler = async (event) => {
  const { name } = await parseBody(event, NameBody);
  return respond(() => calc.deleteEvent(name));
};
