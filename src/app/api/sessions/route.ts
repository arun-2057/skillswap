import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";
import { createSessionSchema } from "@/lib/validators";
import {
  success,
  error,
  notFound,
  unauthorized,
  forbidden,
  serverError,
  paginatedResponse,
} from "@/lib/api-utils";

const sessionsQuerySchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const queryParams = sessionsQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!queryParams.success) {
      return error("VALIDATION_ERROR", queryParams.error.issues[0].message);
    }

    const { status, cursor, limit } = queryParams.data;

    const where: Prisma.SessionWhereInput = {
      OR: [{ learnerId: user.id }, { teacherId: user.id }],
      ...(status && { status }),
    };

    const sessions = await db.session.findMany({
      where: {
        ...where,
        ...(cursor && { createdAt: { lt: new Date(cursor) } }),
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            category: true,
            creditCost: true,
          },
        },
        learner: {
          select: { id: true, name: true, avatar: true },
        },
        teacher: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = sessions.length > limit;
    const sessionsPage = hasMore ? sessions.slice(0, limit) : sessions;
    const nextCursor = hasMore
      ? sessionsPage[sessionsPage.length - 1].createdAt.toISOString()
      : undefined;

    return paginatedResponse(sessionsPage, hasMore, nextCursor);
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("[GET /api/sessions]", err);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return error("VALIDATION_ERROR", parsed.error.issues[0].message);
    }

    const { listingId, scheduledAt, durationMinutes } = parsed.data;

    // Check listing exists and is active
    const listing = await db.skillListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return notFound("Listing not found");
    }

    if (!listing.isActive) {
      return error("LISTING_INACTIVE", "This listing is no longer available");
    }

    // Check learner is not the teacher
    if (listing.userId === user.id) {
      return error(
        "SELF_BOOKING",
        "You cannot book a session on your own listing"
      );
    }

    // Check learner has enough credits
    if (user.creditBalance < listing.creditCost) {
      return error(
        "INSUFFICIENT_CREDITS",
        `You need at least ${listing.creditCost} credits to book this session. Your balance: ${user.creditBalance}`
      );
    }

    const scheduledDate = new Date(scheduledAt);

    // Use transaction for credit operations
    const result = await db.$transaction(async (tx) => {
      // Create session with PENDING status
      const session = await tx.session.create({
        data: {
          learnerId: user.id,
          teacherId: listing.userId,
          listingId,
          scheduledAt: scheduledDate,
          durationMinutes,
          status: "PENDING",
        },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              category: true,
              creditCost: true,
            },
          },
          learner: {
            select: { id: true, name: true, avatar: true },
          },
          teacher: {
            select: { id: true, name: true, avatar: true },
          },
        },
      });

      // Hold credits: deduct from learner balance
      await tx.user.update({
        where: { id: user.id },
        data: { creditBalance: { decrement: listing.creditCost } },
      });

      // Create SPEND transaction record
      await tx.transaction.create({
        data: {
          fromUserId: user.id,
          toUserId: listing.userId,
          amount: listing.creditCost,
          type: "SPEND",
          sessionId: session.id,
        },
      });

      // Create SESSION_REQUEST notification for teacher
      await tx.notification.create({
        data: {
          userId: listing.userId,
          type: "SESSION_REQUEST",
          message: `${user.name || "A learner"} requested a session for "${listing.title}"`,
          metadata: JSON.stringify({
            sessionId: session.id,
            listingId,
            learnerId: user.id,
            learnerName: user.name,
          }),
        },
      });

      return session;
    });

    return success(result, 201);
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("[POST /api/sessions]", err);
    return serverError();
  }
}
