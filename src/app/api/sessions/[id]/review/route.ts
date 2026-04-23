import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";
import { createReviewSchema } from "@/lib/validators";
import {
  success,
  error,
  notFound,
  unauthorized,
  forbidden,
  serverError,
} from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: sessionId } = await params;

    const session = await db.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return notFound("Session not found");
    }

    // Session must be COMPLETED
    if (session.status !== "COMPLETED") {
      return error(
        "INVALID_STATUS",
        "You can only review completed sessions"
      );
    }

    // Only learner or teacher can review
    if (session.learnerId !== user.id && session.teacherId !== user.id) {
      return forbidden("Only the learner or teacher can review this session");
    }

    // Check unique constraint: one review per user per session
    const existingReview = await db.review.findUnique({
      where: {
        reviewerId_sessionId: {
          reviewerId: user.id,
          sessionId,
        },
      },
    });

    if (existingReview) {
      return error("ALREADY_REVIEWED", "You have already reviewed this session");
    }

    // Validate body
    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return error("VALIDATION_ERROR", parsed.error.issues[0].message);
    }

    const { rating, comment } = parsed.data;

    // Determine reviewee: learner reviews teacher, teacher reviews learner
    const revieweeId =
      session.learnerId === user.id ? session.teacherId : session.learnerId;

    // Create review and recalculate average rating in transaction
    const result = await db.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          reviewerId: user.id,
          revieweeId,
          sessionId,
          rating,
          comment,
        },
        include: {
          reviewer: {
            select: { id: true, name: true, avatar: true },
          },
          reviewee: {
            select: { id: true, name: true, avatar: true },
          },
        },
      });

      // Recalculate reviewee's averageRating
      const reviewsAgg = await tx.review.aggregate({
        where: { revieweeId },
        _avg: { rating: true },
      });

      const newAverageRating = Math.round((reviewsAgg._avg.rating ?? 0) * 100) / 100;

      await tx.user.update({
        where: { id: revieweeId },
        data: { averageRating: newAverageRating },
      });

      // Create REVIEW_RECEIVED notification for reviewee
      await tx.notification.create({
        data: {
          userId: revieweeId,
          type: "REVIEW_RECEIVED",
          message: `${user.name || "Someone"} left you a ${rating}-star review`,
          metadata: JSON.stringify({
            reviewId: review.id,
            sessionId,
            rating,
            fromUserId: user.id,
          }),
        },
      });

      return review;
    });

    return success(result, 201);
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("[POST /api/sessions/[id]/review]", err);
    return serverError();
  }
}
