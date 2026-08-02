'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login, requestMagicLink } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const authLogin = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'password' | 'magic'>('password');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'magic') {
        await requestMagicLink(email);
        setError('Check your email for a magic link!');
        return;
      }
      const res: any = await login(email, password);
      authLogin(res.data.user, res.data.accessToken, res.data.refreshToken);
      router.push('/overview');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-2xl border border-border">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">Honey AI</h1>
          <p className="mt-2 text-muted-foreground">Marketing Platform</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && <div className="p-3 text-sm bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">{error}</div>}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
          </div>

          {mode === 'password' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : mode === 'magic' ? 'Send Magic Link' : 'Sign In'}
          </Button>

          <div className="text-center">
            <button type="button" onClick={() => setMode(mode === 'password' ? 'magic' : 'password')} className="text-sm text-muted-foreground hover:text-primary">
              {mode === 'password' ? 'Sign in with magic link instead' : 'Sign in with password instead'}
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-primary hover:underline font-medium">Create one</a>
          </p>
        </form>
      </div>
    </div>
  );
}