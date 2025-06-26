import { Context } from '@/data/documentTypes/Context';
import { Factory } from './Factory';

export class ContextFactory implements Factory<Context> {
  create(data: Partial<Context> = {}): Context {
    return {
      _id: `context-${data.name || 'default'}`,
      _rev: data._rev,
      type: 'context',
      name: data.name || 'default',
      deletedAt: data.deletedAt || null,
    };
  }
}
