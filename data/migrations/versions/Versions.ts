import { Migration } from '@/data/migrations/Migration';
import V1AddMigrationsDoc from '@/data/migrations/versions/V1AddMigrationsDoc';
import V2AddSortOrderToTasks from '@/data/migrations/versions/V2AddSortOrderToTasks';
import V3AddArchivedAtToContexts from '@/data/migrations/versions/V3AddArchivedAtToContexts';
import V4UpdateSortsToFractionalString from '@/data/migrations/versions/V4UpdateSortsToFractionalString';

export const DATABASE_VERSION = 3;

export const VERSIONS: Migration[] = [
  new V1AddMigrationsDoc(),
  new V2AddSortOrderToTasks(),
  new V3AddArchivedAtToContexts(),
  new V4UpdateSortsToFractionalString(),
];
