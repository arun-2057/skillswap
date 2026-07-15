'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Users, ArrowRight } from 'lucide-react';

export function AuthPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 size-[500px] bg-primary/25 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 size-[400px] bg-chart-2/25 blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md">
        {/* Logo & Social Proof */}
        <div className="text-center mb-8 animate-in">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="gradient-ring">
                <img
                  src="/logo-mark.svg"
                  alt="SkillSwap"
                  className="size-12 rounded-2xl"
                />
              </div>
              <div className="absolute -top-1 -right-1 animate-float">
                <Sparkles className="size-4 text-amber-400" />
              </div>
            </div>
          </div>
          <Badge variant="outline" className="mb-4 glass-panel border-primary/20 text-xs">
            <Users className="size-3 mr-1.5 text-primary" />
            Join 10,000+ skill swappers
          </Badge>
        </div>

        {/* Auth Card */}
        <Card className="w-full glass-panel border-primary/10 shadow-[0_24px_70px_rgba(15,23,42,0.08)] animate-in-delay-1">
          <Tabs defaultValue="signin">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl gradient-text">Welcome to SkillSwap</CardTitle>
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
                <SignInForm onNavigate={router.push} setUser={setUser} />
              </TabsContent>
              <TabsContent value="signup">
                <SignUpForm onNavigate={router.push} setUser={setUser} />
              </TabsContent>
            </CardContent>

            <CardFooter className="flex-col gap-3 pt-0">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full glass-panel"
                onClick={() => router.push('/browse')}
              >
                Browse as Guest
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </CardFooter>
          </Tabs>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 animate-in-delay-2">
          By continuing, you agree to SkillSwap&apos;s Terms of Service
        </p>
      </div>
    </div>
  );
}

type NavigateFn = (href: string) => void;
type SetUserFn = (user: any) => void;

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Invalid email or password');
        return;
      }

      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          toast.error('Profile not found');
          return;
        }

        const userData = {
          id: data.user.id,
          email: data.user.email!,
          name: profileData.name || data.user.user_metadata?.full_name || null,
          bio: profileData.bio || null,
          avatar: profileData.avatar_url || null,
          timezone: profileData.timezone || 'UTC',
          skillsOffered: profileData.skills_offered || [],
          skillsWanted: profileData.skills_wanted || [],
          averageRating: profileData.average_rating || 0,
          isOnboarded: profileData.is_onboarded || false,
        };

        setUser(userData);
        if (!userData.isOnboarded) {
          onNavigate('/onboarding');
        } else {
          onNavigate('/');
        }
        toast.success('Welcome back!');
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
          className="bg-background/50"
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
          className="bg-background/50"
        />
      </div>
      <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-all" disabled={loading}>
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name: name,
            timezone: 'UTC',
            skills_offered: [],
            skills_wanted: [],
            average_rating: 0,
            is_onboarded: false,
          });

        if (profileError) {
          toast.error('Failed to create profile');
          return;
        }

        toast.success('Account created! Signing you in...');

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError || !signInData.user) {
          toast.error('Failed to sign in after registration');
          return;
        }

        const { data: profileData, error: profileGetError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single();

        if (profileGetError) {
          toast.error('Profile not found');
          return;
        }

        const userData = {
          id: signInData.user.id,
          email: signInData.user.email!,
          name: profileData.name || signInData.user.user_metadata?.full_name || null,
          bio: profileData.bio || null,
          avatar: profileData.avatar_url || null,
          timezone: profileData.timezone || 'UTC',
          skillsOffered: profileData.skills_offered || [],
          skillsWanted: profileData.skills_wanted || [],
          averageRating: profileData.average_rating || 0,
          isOnboarded: profileData.is_onboarded || false,
        };

        setUser(userData);
        onNavigate('/onboarding');
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
          className="bg-background/50"
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
          className="bg-background/50"
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
          className="bg-background/50"
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
          className="bg-background/50"
        />
      </div>
      <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-all" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Create Account
      </Button>
    </form>
  );
}
