'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, MousePointerClick } from 'lucide-react';

export default function AnalyticsPage() {
  const metrics = [
    { label: 'Impressions', value: '0', change: '+0%', icon: BarChart3 },
    { label: 'Engagement', value: '0', change: '+0%', icon: TrendingUp },
    { label: 'Leads', value: '0', change: '+0%', icon: Users },
    { label: 'Clicks', value: '0', change: '+0%', icon: MousePointerClick },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track performance across all marketing channels</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map(m => (
          <Card key={m.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <m.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-green-400">{m.change}</span>
              </div>
              <div className="text-2xl font-bold">{m.value}</div>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Channel Breakdown</CardTitle><CardDescription>Performance by platform</CardDescription></CardHeader>
          <CardContent className="py-8 text-center text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            Charts will render here once data is available.
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Growth Over Time</CardTitle><CardDescription>Monthly trend</CardDescription></CardHeader>
          <CardContent className="py-8 text-center text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
            Time series charts coming soon.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}