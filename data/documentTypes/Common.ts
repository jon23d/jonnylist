export interface Common {
  _id: string; // Unique identifier for the entity
  _rev?: string; // Revision identifier for version control
  version: number; // Version number for tracking changes

  type: 'task' | 'context' | 'preferences';
}
