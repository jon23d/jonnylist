export interface Context {
  _id: string;
  _rev?: string;
  type: 'context';
  name: string;
  version: number;
}
