import { Context } from '@/data/documentTypes/Context';

export function contextFactory(data: Partial<Context> = {}): Context {
  return {
    _id: `context-${data.name || 'default'}`,
    type: 'context',
    name: data.name || 'default',
    filter: {
      requireTags: data.filter?.requireTags || [],
      excludeTags: data.filter?.excludeTags || [],
      requireProjects: data.filter?.requireProjects || [],
      excludeProjects: data.filter?.excludeProjects || [],
    },
  };
}
