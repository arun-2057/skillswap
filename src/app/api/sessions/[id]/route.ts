import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";
import { success, notFound, unauthorized, forbidden, serverError } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const session = await db.session.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            category: true,
            description: true,
            creditCost: true,
            availability: true,
          },
        },
        learner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            averageRating: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            avatar: true,
            averageRating: true,
          },
        },
        transactions: {
          include: {
            fromUser: {
              select: { id: true, name: true, avatar: true },
            },
            toUser: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        reviews: {
          include: {
            reviewer: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!session) {
      return notFound("Session not found");
    }

    // Only learner or teacher can access
    if (session.learnerId !== user.id && session.teacherId !== user.id) {
      return forbidden("You can only view your own sessions");
    }

    return success(session);
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("[GET /api/sessions/[id]]", err);
    return serverError();
  }
}
