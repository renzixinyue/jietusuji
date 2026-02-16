import Dexie, { Table } from 'dexie';

export interface ExtractedData {
  urls: string[];
  emails: string[];
  keywords: string[];
  sentences: string[];
}

export interface Note {
  id?: number;
  title: string;
  content: string;
  originalImage?: string;
  extractedData: ExtractedData;
  tags: string[];
  createdAt: Date;
  updatedAt?: Date;
  visionCaption?: string;
}

export class MyDatabase extends Dexie {
  notes!: Table<Note>;

  constructor() {
    super('ScreenshotNoteApp');
    
    // Initial version
    this.version(1).stores({
      notes: '++id, title, createdAt'
    });
    
    // Add tags index and updatedAt
    this.version(2).stores({
      notes: '++id, title, createdAt, *tags, updatedAt'
    }).upgrade(tx => {
      return tx.table('notes').toCollection().modify(note => {
        if (!note.updatedAt) {
          note.updatedAt = note.createdAt;
        }
      });
    });
    // Version 3: add visionCaption field
    this.version(3).stores({
      notes: '++id, title, createdAt, *tags, updatedAt, visionCaption'
    });
  }
}

export const db = new MyDatabase();

// Helper functions for better type safety
export async function getAllNotes(): Promise<Note[]> {
  return db.notes.orderBy('createdAt').reverse().toArray();
}

export async function getNoteById(id: number): Promise<Note | undefined> {
  return db.notes.get(id);
}

export async function searchNotes(query: string): Promise<Note[]> {
  const lowerQuery = query.toLowerCase();
  return db.notes
    .filter(note => 
      note.title.toLowerCase().includes(lowerQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      note.content.toLowerCase().includes(lowerQuery)
    )
    .toArray();
}

export async function deleteNoteById(id: number): Promise<void> {
  return db.notes.delete(id);
}

export async function updateNote(id: number, changes: Partial<Note>): Promise<number> {
  return db.notes.update(id, {
    ...changes,
    updatedAt: new Date()
  });
}
