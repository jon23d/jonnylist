import { Migration } from '@/data/migrations/Migration';
import V1AddMigrationsDoc from '@/data/migrations/versions/V1AddMigrationsDoc';

export const VERSIONS: Migration[] = [new V1AddMigrationsDoc()];
