import Dexie, { Table } from 'dexie';

export interface Note {
  id?: number;
  title: string;
  content: string; // Extracted raw text
  originalImage?: string; // Base64 or Blob URL (Careful with storage size in IndexedDB, blobs are better)
  extractedData: {
    urls: string[];
    emails: string[];
    keywords: string[];
    sentences: string[];
  };
  tags: string[]; // User managed tags
  createdAt: Date;
}

export class MyDatabase extends Dexie {
  notes!: Table<Note>;

  constructor() {
    super('ScreenshotNoteApp');
    this.version(1).stores({
      notes: '++id, title, createdAt'
    });
    // Upgrade schema
    this.version(2).stores({
      notes: '++id, title, createdAt, *tags' // Add index for tags
    });
  }
}

export const db = new MyDatabase();
