import Dexie, { Table } from 'dexie';

export interface StorageItem {
    key: string;
    value: string;
}

export class AiWriterDB extends Dexie {
    kv!: Table<StorageItem, string>;

    constructor() {
        super('ai-writer-db');
        this.version(1).stores({
            kv: 'key', // Primary key is 'key'
        });
    }
}

export const db = new AiWriterDB();
