import type { PublishingPlatform } from './common';

export interface PublishingChannel {
  id: string;
  teamId: string;
  platform: PublishingPlatform;
  name: string;
  isConnected: boolean;
  credentials?: Record<string, string>;
  dailyLimit: number;
  dailyUsed: number;
  lastPostedAt?: string;
  createdAt: string;
}

export interface PublishedArticle {
  id: string;
  contentId: string;
  platform: PublishingPlatform;
  url: string;
  title: string;
  publishedAt: string;
  backlinkCount: number;
}

export interface BacklinkReport {
  id: string;
  teamId: string;
  totalLinks: number;
  platforms: Record<PublishingPlatform, { posted: number; errors: number }>;
  urls: { title: string; url: string; platform: PublishingPlatform }[];
  generatedAt: string;
}