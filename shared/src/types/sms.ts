export interface SmsOptIn {
  id: string;
  prospectId: string;
  phoneNumber: string;
  source: string;
  incentiveCode?: string;
  isActive: boolean;
  optedInAt: string;
  optedOutAt?: string;
}

export interface SmsCampaign {
  id: string;
  teamId: string;
  name: string;
  message: string;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  responseCount: number;
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface SmsIncentive {
  code: string;
  description: string;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  isActive: boolean;
  maxRedemptions: number;
  currentRedemptions: number;
}