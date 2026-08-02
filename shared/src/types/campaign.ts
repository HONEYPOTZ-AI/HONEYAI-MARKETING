import type { DateRange, PaginatedResponse } from './common';

export type CampaignType = 'email' | 'sms' | 'linkedin' | 'multi';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface Campaign {
  id: string;
  teamId: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  targetCount: number;
  sentCount: number;
  deliveredCount: number;
  openRate?: number;
  clickRate?: number;
  replyRate?: number;
  scheduledAt?: string;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignListResponse extends PaginatedResponse<Campaign> {}

export interface CreateCampaignDTO {
  name: string;
  type: CampaignType;
  channelConfig?: Record<string, unknown>;
  targetIds?: string[];
  scheduledAt?: string;
}

export interface CampaignMetrics {
  campaignId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  dateRange: DateRange;
}