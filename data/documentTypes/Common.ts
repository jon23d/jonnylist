export interface Common {
  _id: string; // Unique identifier for the entity
  _rev?: string; // Revision identifier for version control

  // TODO: Kill this field. We are only using the migration version in the migrations document now
  version: number; // Version number for tracking changes

  type: 'task' | 'context' | 'preferences';
}
