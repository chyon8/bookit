export enum ReadingStatus {
  Reading = "Reading",
  Finished = "Finished",
  Dropped = "Dropped",
  WantToRead = "Want to Read",
}

export interface Book {
  id: string; // Database UUID
  isbn13?: string; // Aladin search result ID
  title: string;
  author: string;
  category: string;
  coverImageUrl: string;
  description: string;
}

// This interface combines schema.sql and user requirements.
export interface UserBook {
  id?: string;
  user_id?: string;
  book_id?: string;
  created_at?: string;
  updated_at?: string;
  start_date?: string;
  end_date?: string;
  dateRead?: string;

  // Fields from schema.sql
  one_line_review?: string;
  motivation?: string;
  summary?: string;
  memorable_quotes?: string[];
  learnings?: string;
  questions_from_book?: string[];
  reread_will?: boolean;
  reread_reason?: string;
  connected_thoughts?: string;
  overall_impression?: string;
  worth_owning?: boolean;

  // Fields requested by user
  rating?: number; // 0-5
  status?: ReadingStatus;

  // Extra client-side fields
  notes?: string; // From Notion
}

export interface BookWithReview extends Book {
  review?: Partial<UserBook>;
  isInBookshelf?: boolean;
}

export type View = "search" | "bookshelf" | "stats" | "chat";
