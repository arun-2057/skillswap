'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { completeOnboardingSchema } from '@/lib/validators';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagInput } from '@/components/common/tag-input';
import { ArrowLeft, ArrowRight, Loader2, User, Sparkles, Target, Check, Lightbulb } from 'lucide-react';

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

const STEPS = [
  { num: 1, title: 'Basic Info', icon: User, desc: 'Tell us about yourself' },
  { num: 2, title: 'Skills You Offer', icon: Sparkles, desc: 'What can you teach?' },
  { num: 3, title: 'Skills You Want', icon: Target, desc: 'What do you want to learn?' },
];

export function OnboardingPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState<string>('');
  const [skillsOffered, setSkillsOffered] = useState<string[]>([]);
  const [skillsWanted, setSkillsWanted] = useState<string[]>([]);

  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected && TIMEZONES.includes(detected)) {
        setTimezone(detected);
      }
    } catch {
      // ignore
    }
  }, []);

  function canProceed(): boolean {
    if (step === 1) return name.trim().length >= 2 && timezone.length > 0;
    if (step === 2) return skillsOffered.length >= 1;
    if (step === 3) return skillsWanted.length >= 1;
    return false;
  }

  async function handleComplete() {
    const result = completeOnboardingSchema.safeParse({
      name,
      timezone,
      skillsOffered,
      skillsWanted,
      bio: bio || undefined,
    });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          bio: bio || null,
          timezone,
          skills_offered: skillsOffered,
          skills_wanted: skillsWanted,
          is_onboarded: true,
        })
        .eq('id', user.id);

      if (error) {
        toast.error(error.message || 'Onboarding failed');
        return;
      }

      setUser({
        id: user.id,
        email: user.email!,
        name,
        bio: bio || null,
        avatar: null,
        timezone,
        skillsOffered,
        skillsWanted,
        averageRating: 0,
        isOnboarded: true,
      });

      toast.success('Profile setup complete! Welcome to SkillSwap.');
      router.push('/');
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

  const currentStepConfig = STEPS[step - 1];
  const CurrentIcon = currentStepConfig.icon;

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-0 right-1/4 size-[500px] bg-chart-2/20 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-0 left-1/4 size-[400px] bg-chart-4/15 blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8 animate-in">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="gradient-ring">
                <div className="rounded-full bg-background p-3">
                  <CurrentIcon className="size-8 text-primary" />
                </div>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">Set Up Your Profile</span>
          </h1>
          <p className="text-muted-foreground">
            Step {step} of 3 — {currentStepConfig.title}
          </p>
          <p className="text-sm text-muted-foreground/80 mt-1">
            {currentStepConfig.desc}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
            <Lightbulb className="size-3.5" />
            Add a few clear skills to help others discover you faster.
          </div>
          <Progress value={(step / 3) * 100} className="mt-4 h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-3 mb-8 animate-in-delay-1">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = s.num === step;
            const isCompleted = s.num < step;

            return (
              <div key={s.num} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex size-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground shadow-lg scale-110'
                        : isCompleted
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-muted bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="size-5" />
                    ) : (
                      <Icon className="size-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-8 sm:w-12 transition-colors duration-300 ${
                      isCompleted ? 'bg-primary/40' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <Card className="w-full glass-panel border-primary/10 animate-in-delay-2">
          <CardContent className="space-y-6 pt-6">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="onboard-name">Name *</Label>
                  <Input
                    id="onboard-name"
                    placeholder="Your display name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">Use your real name or a friendly nickname people will recognize.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onboard-bio">Bio</Label>
                  <Textarea
                    id="onboard-bio"
                    placeholder="A short description about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="bg-background/50 resize-none"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Share a little about your background or teaching style.</span>
                    <span>{bio.length}/500</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Timezone *</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="w-full bg-background/50">
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
                  <Sparkles className="size-4 text-primary" />
                  <span className="text-sm font-medium">What skills can you teach others?</span>
                </div>
                <p className="text-sm text-muted-foreground">Add practical skills you enjoy sharing, even if you are still learning yourself.</p>
                <TagInput
                  tags={skillsOffered}
                  onChange={setSkillsOffered}
                  placeholder="Type a skill and press Enter..."
                  suggestions={COMMON_SKILLS}
                />
                {skillsOffered.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {skillsOffered.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="size-4 text-primary" />
                  <span className="text-sm font-medium">What skills do you want to learn?</span>
                </div>
                <p className="text-sm text-muted-foreground">Pick a few things you want to explore so the community can connect you with the right people.</p>
                <TagInput
                  tags={skillsWanted}
                  onChange={setSkillsWanted}
                  placeholder="Type a skill and press Enter..."
                  suggestions={COMMON_SKILLS}
                />
                {skillsWanted.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {skillsWanted.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <div className="flex justify-between px-6 pb-6">
            <Button
              variant="outline"
              onClick={() => (step > 1 ? setStep(step - 1) : router.push('/'))}
              disabled={loading}
              className="glass-panel"
            >
              <ArrowLeft className="size-4 mr-1" />
              {step === 1 ? 'Skip' : 'Back'}
            </Button>
            <Button onClick={handleNext} disabled={!canProceed() || loading} className="shadow-md hover:shadow-lg transition-all">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {step === 3 ? 'Complete' : 'Next'}
              {step < 3 && <ArrowRight className="size-4 ml-1" />}
            </Button>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 animate-in-delay-3">
          You can always update these later in your profile settings
        </p>
      </div>
    </div>
  );
}
