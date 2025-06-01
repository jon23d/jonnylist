import { Context } from '@/data/documentTypes/Context';
import { Factory } from './Factory';

export class ContextFactory implements Factory<Context> {
  create(data: Partial<Context> = {}): Context {
    return {
      _id: `context-${data.name || 'default'}`,
      version: data.version || 1,
      _rev: data._rev,
      type: 'context',
      name: data.name || 'default',
    };
  }
}
