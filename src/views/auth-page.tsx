'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouterStore, type AppRoute } from '@/store/router-store';
import { useAuthStore } from '@/store/auth-store';
import { loginSchema, registerSchema } from '@/lib/validators';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Coins, Loader2 } from 'lucide-react';

export function AuthPage() {
  const { navigate } = useRouterStore();
  const { setUser } = useAuthStore();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <Tabs defaultValue="signin">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Coins className="size-8" />
            </div>
            <CardTitle className="text-2xl">Welcome to SkillSwap</CardTitle>
            <CardDescription>
              Trade skills, not money. Sign in to get started.
            </CardDescription>
            <TabsList className="mx-auto mt-4">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="signin">
              <SignInForm onNavigate={navigate} setUser={setUser} />
            </TabsContent>
            <TabsContent value="signup">
              <SignUpForm onNavigate={navigate} setUser={setUser} />
            </TabsContent>
          </CardContent>

          <CardFooter className="justify-center text-xs text-muted-foreground">
            By continuing, you agree to SkillSwap&apos;s Terms of Service
          </CardFooter>
        </Tabs>
      </Card>
    </div>
  );
}

type NavigateFn = (route: AppRoute) => void;
type SetUserFn = Parameters<typeof useAuthStore.getState>['setUser'] extends (u: infer U) => void ? (u: U) => void : never;

function SignInForm({
  onNavigate,
  setUser,
}: {
  onNavigate: NavigateFn;
  setUser: SetUserFn;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error('Invalid email or password');
        return;
      }

      const meRes = await fetch('/api/users/me');
      if (meRes.ok) {
        const meJson = await meRes.json();
        if (meJson.success && meJson.data) {
          setUser(meJson.data);
          if (!meJson.data.isOnboarded) {
            onNavigate({ page: 'onboarding' });
          } else {
            onNavigate({ page: 'home' });
          }
          toast.success('Welcome back!');
        }
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Sign In
      </Button>
    </form>
  );
}

function SignUpForm({
  onNavigate,
  setUser,
}: {
  onNavigate: NavigateFn;
  setUser: SetUserFn;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const result = registerSchema.safeParse({ name, email, password });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error?.message || 'Registration failed');
        return;
      }

      toast.success('Account created! Signing you in...');

      const signInRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.ok) {
        const meRes = await fetch('/api/users/me');
        if (meRes.ok) {
          const meJson = await meRes.json();
          if (meJson.success && meJson.data) {
            setUser(meJson.data);
            onNavigate({ page: 'onboarding' });
          }
        }
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Name</Label>
        <Input
          id="signup-name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="Min 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-confirm">Confirm Password</Label>
        <Input
          id="signup-confirm"
          type="password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Create Account
      </Button>
    </form>
  );
}
