'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface Plan {
  id: string; name: string; tier: string; pricePerMonth: number; pricePerYear: number;
  currency: string; features: string[]; limits: Record<string, number | boolean>; isActive: boolean;
}

interface Subscription {
  id: string; tier: string; status: string; currentPeriodEnd: string; trialEndsAt?: string;
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  useEffect(() => {
    Promise.all([
      api.get('/billing/plans'),
      api.get('/billing/subscription'),
    ]).then(([plansRes, subRes]) => {
      setPlans(plansRes.data.data);
      setSubscription(subRes.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const currentTier = subscription?.tier;
  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-1">
          {subscription
            ? `Current plan: ${currentTier?.charAt(0).toUpperCase() + currentTier?.slice(1)} — ${subscription.status === 'trialing' ? 'Trial ends ' + new Date(subscription.trialEndsAt!).toLocaleDateString() : 'Active until ' + new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
            : 'Choose a plan to get started'}
        </p>
      </div>

      <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1 w-fit">
        <button onClick={() => setBillingInterval('month')}
          className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-colors', billingInterval === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
          Monthly
        </button>
        <button onClick={() => setBillingInterval('year')}
          className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-colors', billingInterval === 'year' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
          Yearly <span className="text-xs opacity-75">(save ~20%)</span>
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentTier === plan.tier;
          const price = billingInterval === 'month' ? plan.pricePerMonth : plan.pricePerYear;

          return (
            <Card key={plan.id} className={cn('relative flex flex-col', isCurrent && 'ring-2 ring-primary')}>
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Current Plan
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{formatPrice(price)}</span>
                  <span className="text-muted-foreground text-sm">/{billingInterval === 'month' ? 'mo' : 'yr'}</span>
                </div>
                {billingInterval === 'year' && (
                  <CardDescription className="mt-1">{formatPrice(plan.pricePerMonth * 12)} billed annually — save {formatPrice(plan.pricePerMonth * 12 - plan.pricePerYear)}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={isCurrent ? 'outline' : 'default'} disabled={isCurrent}>
                  {isCurrent ? 'Current Plan' : 'Upgrade'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Usage & Limits</CardTitle>
            <CardDescription>Your current plan limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {plans.find(p => p.tier === currentTier)?.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-green-400" /> {f}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}