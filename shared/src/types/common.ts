/** Paginated API response */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Standard API envelope */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Sort direction */
export type SortOrder = 'asc' | 'desc';

/** Date range filter */
export interface DateRange {
  start: string;
  end: string;
}

/** Platform identifier */
export type PublishingPlatform =
  | 'linkedin'
  | 'telegraph'
  | 'rentry'
  | 'writeas'
  | 'pastebin'
  | 'blogger'
  | 'github'
  | 'devto'
  | 'medium'
  | 'gist';

/** Post status */
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'archived';