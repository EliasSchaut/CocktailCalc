import { createCalcService } from './calc';
import { db } from './db';

export const calc = createCalcService(db);
