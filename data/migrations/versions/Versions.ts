import { Migration } from '@/data/migrations/Migration';
import V1AddMigrationsDoc from '@/data/migrations/versions/V1AddMigrationsDoc';
import V2AddSortOrderToTasks from '@/data/migrations/versions/V2AddSortOrderToTasks';

export const VERSIONS: Migration[] = [new V1AddMigrationsDoc(), new V2AddSortOrderToTasks()];
