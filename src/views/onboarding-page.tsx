'use client';

import { useState } from 'react';
import { useRouterStore } from '@/store/router-store';
import { useAuthStore } from '@/store/auth-store';
import { completeOnboardingSchema } from '@/lib/validators';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { TagInput } from '@/components/common/tag-input';
import { ArrowLeft, ArrowRight, Loader2, User, Sparkles, Target } from 'lucide-react';

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const COMMON_SKILLS = [
  'JavaScript',
  'Python',
  'React',
  'TypeScript',
  'Node.js',
  'Guitar',
  'Piano',
  'Cooking',
  'Photography',
  'Spanish',
  'French',
  'Mandarin',
  'Graphic Design',
  'UI/UX Design',
  'Yoga',
  'Fitness',
  'Math',
  'Writing',
  'Marketing',
  'Data Science',
];

export function OnboardingPage() {
  const { navigate } = useRouterStore();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState('');
  const [skillsOffered, setSkillsOffered] = useState<string[]>([]);
  const [skillsWanted, setSkillsWanted] = useState<string[]>([]);

  function canProceed(): boolean {
    if (step === 1) return name.trim().length >= 2 && timezone.length > 0;
    if (step === 2) return skillsOffered.length >= 1;
    if (step === 3) return skillsWanted.length >= 1;
    return false;
  }

  async function handleComplete() {
    const result = completeOnboardingSchema.safeParse({
      name,
      bio: bio || undefined,
      timezone,
      skillsOffered,
      skillsWanted,
    });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error?.message || 'Onboarding failed');
        return;
      }

      if (json.success && json.data) {
        setUser({ ...json.data, creditBalance: json.data.creditBalance });
      }

      toast.success('Profile setup complete! Welcome to SkillSwap.');
      navigate({ page: 'home' });
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (step < 3) setStep(step + 1);
    else handleComplete();
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Set Up Your Profile</CardTitle>
          <CardDescription>
            Step {step} of 3 —{' '}
            {step === 1
              ? 'Basic Info'
              : step === 2
                ? 'Skills You Offer'
                : 'Skills You Want'}
          </CardDescription>
          <Progress value={(step / 3) * 100} className="mt-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => s < step && setStep(s)}
                className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  s === step
                    ? 'bg-primary text-primary-foreground'
                    : s < step
                      ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tell us about yourself</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboard-name">Name *</Label>
                <Input
                  id="onboard-name"
                  placeholder="Your display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboard-bio">Bio</Label>
                <Textarea
                  id="onboard-bio"
                  placeholder="A short description about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">{bio.length}/500</p>
              </div>
              <div className="space-y-2">
                <Label>Timezone *</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  What skills can you teach others?
                </span>
              </div>
              <TagInput
                tags={skillsOffered}
                onChange={setSkillsOffered}
                placeholder="Type a skill and press Enter..."
                suggestions={COMMON_SKILLS}
              />
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  What skills do you want to learn?
                </span>
              </div>
              <TagInput
                tags={skillsWanted}
                onChange={setSkillsWanted}
                placeholder="Type a skill and press Enter..."
                suggestions={COMMON_SKILLS}
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => (step > 1 ? setStep(step - 1) : navigate({ page: 'home' }))}
            disabled={loading}
          >
            <ArrowLeft className="size-4 mr-1" />
            {step === 1 ? 'Skip' : 'Back'}
          </Button>
          <Button onClick={handleNext} disabled={!canProceed() || loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {step === 3 ? 'Complete' : 'Next'}
            {step < 3 && <ArrowRight className="size-4 ml-1" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
