import Dexie, { type EntityTable } from 'dexie';
import type { Exercise, Photo, Session, Template, WaterLog, WeightLog } from '../domain/types';

export interface KV { key: string; value: unknown }

export const db = new Dexie('flint') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>;
  templates: EntityTable<Template, 'id'>;
  sessions: EntityTable<Session, 'id'>;
  water: EntityTable<WaterLog, 'id'>;
  weights: EntityTable<WeightLog, 'id'>;
  photos: EntityTable<Photo, 'id'>;
  kv: EntityTable<KV, 'key'>;
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

// iOS pode apagar dados de sites pouco usados; pedir armazenamento persistente.
if (typeof navigator !== 'undefined') void navigator.storage?.persist?.();
