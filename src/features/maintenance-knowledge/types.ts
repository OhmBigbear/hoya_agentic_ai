export interface ChatSource {
  type: string;
  title: string;
  section?: string;
  version?: string;
  date?: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: ChatSource[];
  confidence?: number;
}

export interface MachineManual {
  id: number;
  title: string;
  version: string;
  updated: string;
  pages: number;
  category: string;
}

export interface MaintenanceProcedure {
  id: number;
  code: string;
  title: string;
  version: string;
  updated: string;
  relevance: number;
}

export interface HistoricalMaintenanceRecord {
  id: number;
  jobId: string;
  machine: string;
  issue: string;
  date: string;
  technician: string;
  duration: string;
}

export interface LessonLearned {
  id: number;
  title: string;
  date: string;
  author: string;
  category: string;
  summary: string;
}
