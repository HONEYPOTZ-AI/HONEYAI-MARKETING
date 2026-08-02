'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { register } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const authLogin = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', teamName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res: any = await register(form.email, form.password, form.fullName, form.teamName || undefined);
      authLogin(res.data.user, res.data.accessToken, res.data.refreshToken);
      router.push('/overview');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-2xl border border-border">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">Honey AI</h1>
          <p className="mt-2 text-muted-foreground">Create your account</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {error && <div className="p-3 text-sm bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">{error}</div>}
          
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="John Doe" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name (optional)</Label>
            <Input id="teamName" value={form.teamName} onChange={(e) => setForm({ ...form, teamName: e.target.value })} placeholder="My Marketing Team" />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline font-medium">Sign in</a>
          </p>
        </form>

        <p className="text-xs text-muted-foreground text-center">Free 14-day trial, no credit card required</p>
      </div>
    </div>
  );
}