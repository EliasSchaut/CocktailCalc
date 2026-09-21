import { createCalcService } from '$lib/db/calc';
import { db } from './db';

export const calc = createCalcService(db);
