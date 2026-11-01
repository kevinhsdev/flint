import Dexie, { type EntityTable } from 'dexie';
import type { Challenge, Exercise, Measure, Photo, Session, Template, WaterLog, WeightLog } from '../domain/types';

export interface KV { key: string; value: unknown }

export const db = new Dexie('flint') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>;
  templates: EntityTable<Template, 'id'>;
  sessions: EntityTable<Session, 'id'>;
  water: EntityTable<WaterLog, 'id'>;
  weights: EntityTable<WeightLog, 'id'>;
  photos: EntityTable<Photo, 'id'>;
  kv: EntityTable<KV, 'key'>;
  measures: EntityTable<Measure, 'id'>;
  challenges: EntityTable<Challenge, 'id'>;
};

db.version(1).stores({
  exercises: 'id',
  templates: 'id, order',
  sessions: 'id, startedAt, endedAt',
  water: 'id, day',
  weights: 'id, day',
  photos: 'id, day',
  kv: 'key',
});
// v2 (fase 2): medidas corporais e desafios
db.version(2).stores({ measures: 'id, day, part', challenges: 'id, startDay' });

// iOS pode apagar dados de sites pouco usados; pedir armazenamento persistente.
if (typeof navigator !== 'undefined') void navigator.storage?.persist?.();
