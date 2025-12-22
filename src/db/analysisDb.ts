import Dexie, { type Table } from 'dexie';
import { AnalysisDocument } from '../types';

export class AnalysisDatabase extends Dexie {
  documents!: Table<AnalysisDocument>;

  constructor() {
    super('AnalysisDatabase');
    this.version(1).stores({
      documents: 'id, timestamp, title', // Index common fields
    });
  }
}

export const db = new AnalysisDatabase();
