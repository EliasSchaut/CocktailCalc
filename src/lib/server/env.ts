import { env as raw } from '$env/dynamic/private';
import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1).default('./db.sqlite3'),
});

export const env = EnvSchema.parse({
  PORT: raw.PORT || undefined,
  DATABASE_URL: raw.DATABASE_URL || undefined,
});
