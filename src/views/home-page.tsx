'use client';

import { useEffect, useState } from 'react';
import { safeJsonArray } from '@/lib/safe-json';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/common/star-rating';
import { SkillLevelIndicator } from '@/components/common/skill-level-indicator';
import { ListingCard } from '@/components/common/listing-card';
import { getInitials } from '@/lib/initials';
import {
  Search,
  BookOpen,
  CalendarCheck,
  ArrowRight,
  Users,
  TrendingUp,
  Shield,
  MessageCircle,
  Award,
  ChevronRight,
  Quote,
  Sparkles,
  Globe,
  Heart,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface ListingCard {
  id: string;
  title: string;
  category: string;
  tags: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedDuration: number;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    averageRating: number;
  };
}

const STEPS = [
  {
    icon: Search,
    title: 'Discover Skills',
    description:
      'Explore learning paths and find skills that match your career goals.',
  },
  {
    icon: Users,
    title: 'Connect & Learn',
    description:
      'Learn from experts and connect with peers in your field.',
  },
  {
    icon: TrendingUp,
    title: 'Teach & Learn Together',
    description:
      'Teach what you know and learn what you don\'t — no money involved.',
  },
] as const;

const FEATURES = [
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Join a vibrant community of learners and teachers from around the world.',
  },
  {
    icon: Shield,
    title: 'Verified Profiles',
    description: 'Trust and safety first with verified profiles and ratings from real users.',
  },
  {
    icon: BookOpen,
    title: 'Any Skill, Any Level',
    description: 'From coding to cooking, find or teach any skill at any difficulty level.',
  },
  {
    icon: CalendarCheck,
    title: 'Flexible Scheduling',
    description: 'Learn on your schedule with flexible session booking and reminders.',
  },
  {
    icon: MessageCircle,
    title: 'Real-time Chat',
    description: 'Connect instantly with messaging, notifications, and video calls.',
  },
  {
    icon: Award,
    title: 'Earn Recognition',
    description: 'Build your reputation with reviews and ratings from the community.',
  },
] as const;

const STATS = [
  { value: '10K+', label: 'Active Learners', icon: Users },
  { value: '5K+', label: 'Skills Shared', icon: BookOpen },
  { value: '25K+', label: 'Sessions Completed', icon: CalendarCheck },
  { value: '4.8', label: 'Average Rating', icon: Award },
] as const;

const TESTIMONIALS = [
  {
    quote: 'SkillSwap transformed how I learn. I taught guitar and learned web development — all for free!',
    author: 'Sarah Chen',
    role: 'Full-stack Developer',
    avatar: null,
  },
  {
    quote: 'The best platform for skill exchange. I found amazing mentors and made real connections.',
    author: 'Marcus Johnson',
    role: 'Designer & Illustrator',
    avatar: null,
  },
  {
    quote: 'Finally, a place where knowledge is currency. The community here is incredibly supportive.',
    author: 'Aisha Patel',
    role: 'Data Scientist',
    avatar: null,
  },
] as const;

export function HomePage() {
  const router = useRouter();
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch('/api/listings?limit=6&sort=newest');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setListings(json.data);
          }
        }
      } catch {
        // Silently fail - homepage should still render
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  const categories = ['all', ...Array.from(new Set(listings.map((l) => l.category)))];

  const filteredListings =
    activeCategory === 'all'
      ? listings
      : listings.filter((l) => l.category === activeCategory);

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden border-b hero-bg-pattern">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 size-[500px] bg-primary/25 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 size-[400px] bg-chart-2/25 blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-chart-4/15 blur-[140px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center hero-glow">
          <div className="flex justify-center mb-6 animate-in">
             <div className="relative">
               <img
                 src="/logo-mark.svg"
                 alt="SkillSwap"
                 className="size-16 rounded-2xl shadow-lg"
               />
               <div className="absolute -top-1 -right-1 animate-float">
                 <Sparkles className="size-5 text-amber-400" />
               </div>
              <div className="absolute -bottom-1 -left-2 animate-float-delayed">
                <Heart className="size-4 text-rose-400" />
              </div>
            </div>
          </div>

          <div className="animate-in-delay-1">
            <Badge variant="outline" className="mb-6 text-sm px-4 py-1.5 glass-panel border-primary/20">
              <Globe className="size-3.5 mr-1.5 text-primary" />
              Join 10,000+ skill swappers worldwide
            </Badge>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 animate-in-delay-2">
            <span className="gradient-text">Learn, Grow, Connect</span>
            <br />
            <span className="text-foreground">Without Spending a Dime</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance animate-in-delay-3">
            Trade skills, not money. Connect with peers who teach what you want to learn and share what you know.
          </p>

          <div className="mx-auto mb-10 flex max-w-2xl flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground animate-in-delay-3">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
              <CheckCircle2 className="size-3.5 text-primary" />
              No payments required
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
              <CheckCircle2 className="size-3.5 text-primary" />
              Real-time coordination
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
              <CheckCircle2 className="size-3.5 text-primary" />
              Built for curious learners
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in-delay-4">
            <Button
              size="lg"
              className="shadow-lg hover:shadow-xl transition-all duration-300 group"
              onClick={() => router.push('/browse')}
            >
              <Search className="size-4 mr-2" />
              Discover Skills
              <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="backdrop-blur glass-panel hover:bg-secondary/80 transition-all duration-300 group"
              onClick={() => router.push('/create-listing')}
            >
              <BookOpen className="size-4 mr-2" />
              Share Your Expertise
              <ChevronRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-gradient-to-b from-secondary/30 to-secondary/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="glass-panel rounded-2xl p-6 text-center card-hover"
                >
                  <Icon className="size-6 text-primary mx-auto mb-3" />
                  <div className="text-2xl sm:text-3xl font-bold gradient-text mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="border-b bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="rounded-[1.75rem] border border-primary/10 bg-gradient-to-br from-background via-background/95 to-primary/5 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary">
                  <Zap className="size-3.5" />
                  Quick start
                </div>
                <h2 className="text-2xl font-semibold sm:text-3xl">
                  Start in under 5 minutes: create a listing, browse matches, and send your first proposal.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  The fastest way to begin is to share one thing you can teach and one thing you want to learn. From there, the community can connect you naturally.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:min-w-[240px]">
                <Button onClick={() => router.push('/create-listing')} className="justify-center">
                  List Your First Skill
                </Button>
                <Button variant="outline" onClick={() => router.push('/browse')} className="justify-center">
                  Explore Listings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative bg-gradient-to-b from-background via-secondary/10 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 glass-panel border-primary/20">
            <Sparkles className="size-3.5 mr-1.5 text-primary" />
            Why SkillSwap?
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Built for the <span className="gradient-text">Curious Mind</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-balance">
            Everything you need to teach, learn, and grow — all in one beautifully designed platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="glass-panel rounded-2xl p-6 card-hover group"
              >
                <div className="rounded-xl bg-primary/10 p-3 w-fit mb-4 group-hover:bg-primary/15 transition-colors">
                  <Icon className="size-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-b bg-secondary/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-balance">
              Three simple steps to start your skill-swapping journey
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="relative mb-6">
                      <div className="size-16 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center shadow-lg">
                        <Icon className="size-7 text-primary" />
                      </div>
                      <div className="absolute -top-1 -right-1 size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative bg-gradient-to-b from-background via-secondary/10 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Loved by <span className="gradient-text">Learners Everywhere</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-balance">
            Don't just take our word for it — hear from our community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.author}
              className="glass-panel rounded-2xl p-6 card-hover"
            >
              <Quote className="size-8 text-primary/30 mb-4" />
              <p className="text-sm leading-relaxed mb-6 text-foreground/90">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  {testimonial.avatar && (
                    <AvatarImage src={testimonial.avatar} />
                  )}
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(testimonial.author)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{testimonial.author}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="border-t bg-gradient-to-b from-secondary/30 via-secondary/15 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <Badge variant="outline" className="mb-4 glass-panel border-primary/20">
                <BookOpen className="size-3.5 mr-1.5 text-primary" />
                Community Picks
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                Featured <span className="gradient-text">Skills</span>
              </h2>
              <p className="text-muted-foreground">
                Latest listings from our community
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/browse')}
              className="glass-panel hidden sm:flex"
            >
              View All
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>

          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className={activeCategory === cat ? '' : 'glass-panel'}
                >
                  {cat === 'all' ? 'All Skills' : cat}
                </Button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border bg-card p-6 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="size-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No listings yet. Be the first to share a skill!</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredListings.map((listing) => {
                  const tags = safeJsonArray(listing.tags);

                  return (
                    <ListingCard key={listing.id} listing={listing} />
                  );
                })}
              </div>
              <div className="flex justify-center mt-10 sm:hidden">
                <Button
                  variant="outline"
                  onClick={() => router.push('/browse')}
                  className="glass-panel"
                >
                  View All Skills
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/3 size-[400px] bg-primary/20 blur-[120px] rounded-full animate-pulse-slow" />
          <div className="absolute bottom-0 right-1/3 size-[300px] bg-chart-2/15 blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Sparkles className="size-4" />
              Start swapping today
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">
              Ready to <span className="gradient-text">Exchange Skills?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 text-balance max-w-xl mx-auto">
              Join thousands of people who are already teaching, learning, and growing together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all duration-300 group"
                onClick={() => router.push('/browse')}
              >
                Get Started Free
                <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="backdrop-blur glass-panel hover:bg-secondary/80 transition-all duration-300"
                onClick={() => router.push('/create-listing')}
              >
                List Your First Skill
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="SkillSwap" className="h-6 w-auto" />
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <button onClick={() => router.push('/browse')} className="hover:text-foreground transition-colors">
                Browse Skills
              </button>
              <button onClick={() => router.push('/create-listing')} className="hover:text-foreground transition-colors">
                Create Listing
              </button>
              <span className="hidden sm:inline">|</span>
              <span>SkillSwap 2025</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
