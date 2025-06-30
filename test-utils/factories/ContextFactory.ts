import { Context } from '@/data/documentTypes/Context';

export function contextFactory(data: Partial<Context> = {}): Context {
  return {
    _id: `context-${data.name || 'default'}`,
    _rev: data._rev,
    type: 'context',
    name: data.name || 'default',
    deletedAt: data.deletedAt || null,
  };
}
