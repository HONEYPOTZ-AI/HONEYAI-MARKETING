export type PlanTier = 'starter' | 'pro' | 'enterprise';

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  pricePerMonth: number;
  pricePerYear: number;
  currency: string;
  features: string[];
  limits: PlanLimits;
  isActive: boolean;
}

export interface PlanLimits {
  maxTeamMembers: number;
  maxPostsPerDay: number;
  maxEmailsPerMonth: number;
  maxSmsPerMonth: number;
  maxContacts: number;
  maxPlatforms: number;
  aiCredits: number;
  customDomain: boolean;
  prioritySupport: boolean;
}

export interface Subscription {
  id: string;
  teamId: string;
  planId: string;
  tier: PlanTier;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void';
  stripeInvoiceId?: string;
  invoiceUrl?: string;
  periodStart: string;
  periodEnd: string;
  paidAt?: string;
}