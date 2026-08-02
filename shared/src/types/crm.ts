export type PipelineStage = 'lead' | 'contacted' | 'responded' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Contact {
  id: string;
  teamId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  position?: string;
  industry?: string;
  location?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  tags: string[];
  stage: PipelineStage;
  score: number;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  teamId: string;
  contactId: string;
  name: string;
  value: number;
  currency: string;
  stage: PipelineStage;
  probability: number;
  expectedCloseDate?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  teamId: string;
  contactId: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'sms' | 'linkedin';
  description: string;
  performedBy: string;
  performedAt: string;
}