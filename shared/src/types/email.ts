export type EmailTemplateType = 'welcome' | 'nurture' | 'promo' | 'followup' | 'transactional' | 'custom';

export interface EmailTemplate {
  id: string;
  teamId: string;
  name: string;
  subject: string;
  body: string;
  type: EmailTemplateType;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EmailSequence {
  id: string;
  teamId: string;
  name: string;
  steps: EmailSequenceStep[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSequenceStep {
  templateId: string;
  delayHours: number;
  condition?: string;
}

export interface EmailSendResult {
  id: string;
  campaignId: string;
  recipientId: string;
  status: 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'spam';
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  error?: string;
}