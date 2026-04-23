import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { success, notFound, error, serverError } from "@/lib/api-utils";

const publicProfileQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return notFound("User not found");
    }

    const searchParams = request.nextUrl.searchParams;
    const queryParams = publicProfileQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!queryParams.success) {
      return error("VALIDATION_ERROR", queryParams.error.issues[0].message);
    }

    const { cursor, limit } = queryParams.data;

    // Parse reviews with pagination
    const reviews = await db.review.findMany({
      where: {
        revieweeId: id,
        ...(cursor && { createdAt: { lt: new Date(cursor) } }),
      },
      include: {
        reviewer: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = reviews.length > limit;
    const reviewsPage = hasMore ? reviews.slice(0, limit) : reviews;
    const nextCursor = hasMore ? reviewsPage[reviewsPage.length - 1].createdAt.toISOString() : undefined;

    const reviewCount = await db.review.count({
      where: { revieweeId: id },
    });

    const activeListingCount = await db.skillListing.count({
      where: { userId: id, isActive: true },
    });

    return success({
      id: user.id,
      name: user.name,
      bio: user.bio,
      avatar: user.avatar,
      timezone: user.timezone,
      skillsOffered: JSON.parse(user.skillsOffered),
      skillsWanted: JSON.parse(user.skillsWanted),
      averageRating: user.averageRating,
      reviewCount,
      activeListingCount,
      createdAt: user.createdAt,
      reviews: reviewsPage.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewer: r.reviewer,
      })),
      pagination: {
        hasMore,
        nextCursor,
      },
    });
  } catch (err) {
    console.error("[GET /api/users/[id]]", err);
    return serverError();
  }
}
