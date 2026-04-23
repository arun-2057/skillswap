'use client';

import { useEffect, useState } from 'react';
import { useRouterStore } from '@/store/router-store';
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
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export function CreateListingPage() {
  const { route, navigate, goBack } = useRouterStore();
  const { user, isAuthenticated } = useAuthStore();
  const editId = route.page === 'create-listing' ? route.editId : undefined;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [creditCost, setCreditCost] = useState('');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);

  useEffect(() => {
    if (!editId) return;

    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${editId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const data = json.data;
            setTitle(data.title);
            setCategory(data.category);
            setTags(JSON.parse(data.tags || '[]'));
            setDescription(data.description);
            setCreditCost(String(data.creditCost));
            setAvailability(data.availability);
          }
        }
      } catch {
        toast.error('Failed to load listing');
        goBack();
      } finally {
        setFetching(false);
      }
    }
    fetchListing();
  }, [editId, goBack]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ page: 'home' });
    }
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = createListingSchema.safeParse({
      title,
      category,
      tags,
      description,
      creditCost: parseInt(creditCost),
      availability,
    });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const url = editId
        ? `/api/listings/${editId}`
        : '/api/listings';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error?.message || 'Failed to save listing');
        return;
      }

      toast.success(editId ? 'Listing updated!' : 'Listing created!');
      navigate({ page: 'browse' });
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
        onClick={goBack}
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
              : 'Share your skills with the community'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="listing-title">Title *</Label>
              <Input
                id="listing-title"
                placeholder="e.g., Learn Python for Data Science"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
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
              <Label>Tags</Label>
              <TagInput
                tags={tags}
                onChange={setTags}
                placeholder="Add relevant tags..."
              />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="listing-cost">Credit Cost *</Label>
                <Input
                  id="listing-cost"
                  type="number"
                  min="1"
                  max="500"
                  placeholder="e.g., 25"
                  value={creditCost}
                  onChange={(e) => setCreditCost(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  1–500 credits
                </p>
              </div>

              <div className="space-y-2">
                <Label>Availability *</Label>
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
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
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
