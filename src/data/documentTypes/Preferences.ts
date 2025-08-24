import { Common } from '@/data/documentTypes/Common';
import { TaskStatus } from '@/data/documentTypes/Task';

export interface CoefficientRule {
  type: 'tag' | 'project';
  name: string;
  value: number;
}

export interface Preferences extends Common {
  lastSelectedContext: string;
  lastSelectedStatuses?: TaskStatus[];
  coefficients?: {
    nextTag?: number;
    nearDueDate?: number;
    highPriority?: number;
    mediumPriority?: number;
    lowPriority?: number;
    startedStatus?: number;
    hasDescription?: number;
    hasTags?: number;
    hasProject?: number;
    ageCoefficient?: number;
    customCoefficients?: CoefficientRule[];
  };
  dashboard?: {
    hideIntro?: boolean;
  };
}

export function createDefaultPreferences(): Preferences {
  return {
    _id: 'preferences',
    type: 'preferences',
    lastSelectedContext: '',
    lastSelectedStatuses: [TaskStatus.Ready],
  };
}
