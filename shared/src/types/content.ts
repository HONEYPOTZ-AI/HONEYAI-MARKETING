export type ContentType = 'blog' | 'social' | 'email' | 'landing' | 'ad';

export interface GeneratedContent {
  id: string;
  teamId: string;
  title: string;
  body: string;
  type: ContentType;
  tone: string;
  topic: string;
  keywords: string[];
  seoScore?: number;
  model: string;
  tokensUsed: number;
  createdAt: string;
}

export interface ContentGenerationRequest {
  topic: string;
  type: ContentType;
  tone?: 'professional' | 'casual' | 'technical' | 'inspirational' | 'sales';
  length?: 'short' | 'medium' | 'long';
  keywords?: string[];
  targetAudience?: string;
  includeSeo?: boolean;
  relatedUrls?: string[];
}