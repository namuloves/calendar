export type Entry = { day: string; emoji: string | null; note: string };
export type Photo = { id: string; day: string; url: string; created: number; path?: string };

export interface Store {
  loadEntries(): Promise<Entry[]>;
  saveEntry(e: Entry): Promise<void>;
  clearDay(day: string): Promise<void>;
  listPhotos(): Promise<Photo[]>;
  addPhoto(day: string, file: Blob): Promise<Photo>;
  deletePhoto(p: Photo): Promise<void>;
}
