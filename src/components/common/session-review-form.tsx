"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface ReviewFormProps {
  sessionId: string;
  onSuccess: () => void;
}

export function SessionReviewForm({ sessionId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("reviews").insert([
      { session_id: sessionId, rating, comment },
    ]);

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Review submitted! Thank you for backing your peer.");
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmitReview} className="space-y-4 p-4 border rounded-xl bg-card">
      <div className="space-y-1">
        <label className="text-sm font-medium">Rate the session experience</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="text-amber-400 transition-transform active:scale-95"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              <Star
                className="h-6 w-6"
                fill={(hoverRating || rating) >= star ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Comments</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share what you learned or feedback on their teaching style..."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
