'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { createListingSchema, categories } from '@/lib/validators';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagInput } from '@/components/common/tag-input';
import { ArrowLeft, Loader2, Save, Sparkles, CalendarDays, Tags } from 'lucide-react';
import {
  getListingByIdAction,
  createListingAction,
  updateListingAction,
} from '@/app/actions/listings';

export function CreateListingPage({ editId }: { editId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const resolvedEditId = editId || searchParams?.get('editId') || undefined;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);

  const listingId = editId!;

  useEffect(() => {
    if (!listingId) return;

    async function fetchListing() {
      try {
        const data = await getListingByIdAction(listingId);
        if (data && data.id) {
          setTitle(data.title);
          setCategory(data.category);
          setTags(JSON.parse((data as any).tags || '[]'));
          setDescription(data.description);
          setAvailability((data as any).availability || '');
        } else {
          toast.error('Listing not found');
          router.push('/browse');
        }
      } catch {
        toast.error('Failed to load listing');
        router.push('/browse');
      } finally {
        setFetching(false);
      }
    }
    fetchListing();
  }, [listingId, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = createListingSchema.safeParse({
      title,
      category,
      tags,
      description,
      availability,
    });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('tags', JSON.stringify(tags));
      formData.append('availability', availability);

      const action = editId
        ? updateListingAction(editId, formData)
        : createListingAction(formData);

      const result = await action;

      if (!result.ok) {
        toast.error(result.error || 'Failed to save listing');
        return;
      }

      toast.success(editId ? 'Listing updated!' : 'Listing created!');
      router.push('/browse');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex-1 mx-auto max-w-2xl px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-24 mb-6" />
        <div className="rounded-xl border p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2"
        onClick={() => router.push('/browse')}
      >
        <ArrowLeft className="size-4 mr-1" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{editId ? 'Edit Listing' : 'Create Listing'}</CardTitle>
          <CardDescription>
            {editId
              ? 'Update your skill listing details'
              : 'Make it easy for learners to understand what you can teach and when you are available.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="listing-title" className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Title *
              </Label>
              <Input
                id="listing-title"
                placeholder="e.g., Python for Data Science"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Use a clear, outcome-focused title so learners instantly know what they will gain.</p>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tags className="size-4 text-primary" />
                Tags
              </Label>
              <TagInput
                tags={tags}
                onChange={setTags}
                placeholder="Add relevant tags..."
              />
              <p className="text-xs text-muted-foreground">Add 3–5 tags to improve discovery, such as topic, level, or format.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="listing-desc">Description *</Label>
              <Textarea
                id="listing-desc"
                placeholder="Describe what you'll teach, your experience level, and what the learner can expect..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/2000 characters (min 20)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />
                Availability *
              </Label>
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKDAYS">Weekdays</SelectItem>
                  <SelectItem value="WEEKENDS">Weekends</SelectItem>
                  <SelectItem value="BOTH">Both</SelectItem>
                  <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Let people know when you are usually available so they can plan around you.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/browse')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                <Save className="size-4 mr-1" />
                {editId ? 'Update Listing' : 'Create Listing'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
