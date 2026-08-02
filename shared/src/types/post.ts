import type { PostStatus, PublishingPlatform } from './common';

export interface ScheduledPost {
  id: string;
  teamId: string;
  userId: string;
  content: string;
  platform: PublishingPlatform;
  status: PostStatus;
  scheduledFor: string;
  publishedAt?: string;
  platformPostId?: string;
  platformPostUrl?: string;
  imageUrl?: string;
  tags: string[];
  analytics?: PostAnalytics;
  createdAt: string;
  updatedAt: string;
}

export interface PostAnalytics {
  impressions: number;
  clicks: number;
  likes: number;
  shares: number;
  comments: number;
}

export interface CreatePostDTO {
  content: string;
  platform: PublishingPlatform;
  scheduledFor?: string;
  imageUrl?: string;
  tags?: string[];
}

export interface GeneratePostDTO {
  topic: string;
  tone?: 'professional' | 'casual' | 'technical' | 'inspirational';
  platform: PublishingPlatform;
  length?: 'short' | 'medium' | 'long';
}