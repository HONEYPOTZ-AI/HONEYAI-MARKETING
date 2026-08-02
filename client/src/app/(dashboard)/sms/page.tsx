'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Plus, Send, Gift, CheckCircle, XCircle } from 'lucide-react';

export default function SmsPage() {
  const [showIncentive, setShowIncentive] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discount, setDiscount] = useState('');

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">SMS Marketing</h1><p className="text-muted-foreground mt-1">Manage SMS campaigns, incentives, and opt-ins</p></div>
        <Button onClick={() => setShowIncentive(!showIncentive)} className="gap-2"><Plus className="h-4 w-4" /> New Incentive</Button>
      </div>

      {showIncentive && (
        <Card>
          <CardHeader><CardTitle>Create SMS Incentive</CardTitle><CardDescription>Offer a discount for phone number opt-ins</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Promo Code</Label><Input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. EDGE10" /></div>
              <div><Label>Discount</Label><Input value={discount} onChange={e => setDiscount(e.target.value)} placeholder="e.g. 10% off" /></div>
            </div>
            <div><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the offer..." /></div>
            <div className="flex gap-2">
              <Button disabled={!code.trim()} className="gap-2"><Gift className="h-4 w-4" /> Create Incentive</Button>
              <Button variant="ghost" onClick={() => setShowIncentive(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total Opt-Ins', value: '0', icon: CheckCircle },
          { label: 'Opt-Outs', value: '0', icon: XCircle },
          { label: 'Messages Sent', value: '0', icon: Send },
        ].map(m => (
          <Card key={m.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="text-3xl font-bold mt-1">{m.value}</p>
                </div>
                <m.icon className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Active Incentives</CardTitle></CardHeader>
        <CardContent className="py-8 text-center">
          <Phone className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No SMS incentives created yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Configure Twilio integration to enable SMS campaigns.</p>
        </CardContent>
      </Card>
    </div>
  );
}