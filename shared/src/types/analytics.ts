import type { DateRange } from './common';

export interface DashboardMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalPosts: number;
  scheduledPosts: number;
  totalContacts: number;
  newContactsThisMonth: number;
  emailStats: ChannelStats;
  smsStats: ChannelStats;
  linkedinStats: ChannelStats;
  dateRange: DateRange;
}

export interface ChannelStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  responded: number;
  bounced: number;
  rate: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  type: string;
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    responded: number;
    conversionRate: number;
  };
  timeline: TimeSeriesData[];
}