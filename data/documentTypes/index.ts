import { Context } from '@/data/documentTypes/Context';
import { LocalSettings } from '@/data/documentTypes/LocalSettings';
import { MigrationsDoc } from '@/data/documentTypes/MigrationsDoc';
import { Preferences } from '@/data/documentTypes/Preferences';
import { Task } from '@/data/documentTypes/Task';

export type DocumentTypes = Context | Preferences | Task | MigrationsDoc | LocalSettings;
