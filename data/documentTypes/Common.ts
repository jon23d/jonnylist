export interface Common {
  _id: string; // Unique identifier for the entity
  _rev?: string; // Revision identifier for version control

  type?: 'task' | 'context' | 'preferences';
}
