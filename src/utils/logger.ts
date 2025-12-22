export type LogStage =
  | 'init'
  | 'parsing_product'
  | 'mapping_product'
  | 'nlp_analysis'
  | 'planning_keywords'
  | 'extracting_structure'
  | 'analyzing_visuals'
  | 'writing_content'
  | 'refining_headings'
  | 'finalizing'
  | 'error'
  | 'idle';

interface LogEntry {
  stage: LogStage;
  msg: string;
  meta?: Record<string, any>;
  duration?: number;
}

type LogListener = (entry: LogEntry) => void;

class Logger {
  private listeners: LogListener[] = [];

  subscribe(listener: LogListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  log(stage: LogStage, msg: string, meta?: Record<string, any>, duration?: number) {
    const entry: LogEntry = { stage, msg, meta, duration };

    // Console output
    const durationStr = duration ? ` (${duration}ms)` : '';
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    console.log(`[${stage}] ${msg}${durationStr}${metaStr}`);

    // Notify listeners (e.g., UI)
    this.listeners.forEach((l) => l(entry));
  }

  warn(stage: LogStage, msg: string, error?: unknown) {
    console.warn(`[${stage}] ${msg}`, error);
    this.listeners.forEach((l) => l({ stage, msg: `WARNING: ${msg}`, meta: { error } }));
  }

  error(stage: LogStage, msg: string, error?: unknown) {
    console.error(`[${stage}] ${msg}`, error);
    this.listeners.forEach((l) => l({ stage, msg: `ERROR: ${msg}`, meta: { error } }));
  }
}

export const logger = new Logger();
