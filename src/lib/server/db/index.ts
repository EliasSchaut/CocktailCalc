import { env } from '$lib/server/env';
import { createDb } from './client';

export const db = createDb(env.DATABASE_URL);
export * as schema from './schema';
