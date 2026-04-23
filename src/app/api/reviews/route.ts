import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { notFound, error, serverError, paginatedResponse } from "@/lib/api-utils";

const reviewsQuerySchema = z.object({
  userId: z.string().min(1, "userId is required"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = reviewsQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!queryParams.success) {
      return error("VALIDATION_ERROR", queryParams.error.issues[0].message);
    }

    const { userId, cursor, limit } = queryParams.data;

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return notFound("User not found");
    }

    const reviews = await db.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && {
        cursor: { createdAt: new Date(cursor) },
        skip: 1,
      }),
    });

    const hasMore = reviews.length > limit;
    const reviewsPage = hasMore ? reviews.slice(0, limit) : reviews;
    const nextCursor = hasMore
      ? reviewsPage[reviewsPage.length - 1].createdAt.toISOString()
      : undefined;

    return paginatedResponse(reviewsPage, hasMore, nextCursor);
  } catch (err) {
    console.error("[GET /api/reviews]", err);
    return serverError();
  }
}
