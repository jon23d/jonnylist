import { Migration } from '@/data/migrations/Migration';
import V1AddMigrationsDoc from '@/data/migrations/versions/V1AddMigrationsDoc';
import V2AddSortOrderToTasks from '@/data/migrations/versions/V2AddSortOrderToTasks';
import V3AddArchivedAtToContexts from '@/data/migrations/versions/V3AddArchivedAtToContexts';
import V4UpdateSortsToFractionalString from '@/data/migrations/versions/V4UpdateSortsToFractionalString';
import V5UpdatePriorities from '@/data/migrations/versions/V5UpdatePriorities';
import V6RemoveContextAndSortOrder from '@/data/migrations/versions/V6RemoveContextAndSortOrder';
import V7AddRecurrenceIndex from '@/data/migrations/versions/V7AddRecurrenceIndex';
import V8UpdateRecurrenceParamsToNumbers from '@/data/migrations/versions/V8UpdateRecurrenceParamsToNumbers';
import V9ClearMinimumDaysFromContextFilters from '@/data/migrations/versions/V9ClearMinimumDaysFromContextFilters';

export const DATABASE_VERSION = 8;

export const VERSIONS: Migration[] = [
  new V1AddMigrationsDoc(),
  new V2AddSortOrderToTasks(),
  new V3AddArchivedAtToContexts(),
  new V4UpdateSortsToFractionalString(),
  new V5UpdatePriorities(),
  new V6RemoveContextAndSortOrder(),
  new V7AddRecurrenceIndex(),
  new V8UpdateRecurrenceParamsToNumbers(),
  new V9ClearMinimumDaysFromContextFilters(),
];
