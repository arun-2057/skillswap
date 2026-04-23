import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";
import { updateSessionStatusSchema } from "@/lib/validators";
import {
  success,
  error,
  notFound,
  unauthorized,
  forbidden,
  serverError,
} from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const session = await db.session.findUnique({
      where: { id },
      include: {
        listing: {
          select: { creditCost: true, title: true },
        },
        learner: {
          select: { id: true, name: true },
        },
        teacher: {
          select: { id: true, name: true },
        },
      },
    });

    if (!session) {
      return notFound("Session not found");
    }

    // Only learner or teacher can access
    if (session.learnerId !== user.id && session.teacherId !== user.id) {
      return forbidden("You can only update your own sessions");
    }

    const body = await request.json();
    const parsed = updateSessionStatusSchema.safeParse(body);

    if (!parsed.success) {
      return error("VALIDATION_ERROR", parsed.error.issues[0].message);
    }

    const { status } = parsed.data;

    // CONFIRM: Teacher can CONFIRM a PENDING session
    if (status === "CONFIRMED") {
      if (session.status !== "PENDING") {
        return error(
          "INVALID_STATUS",
          "Only pending sessions can be confirmed"
        );
      }
      if (session.teacherId !== user.id) {
        return forbidden("Only the teacher can confirm a session");
      }

      const result = await db.$transaction(async (tx) => {
        const updatedSession = await tx.session.update({
          where: { id },
          data: { status: "CONFIRMED" },
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

        // Create SESSION_CONFIRMED notification for learner
        await tx.notification.create({
          data: {
            userId: session.learnerId,
            type: "SESSION_CONFIRMED",
            message: `Your session for "${session.listing.title}" has been confirmed by ${session.teacher.name || "the teacher"}`,
            metadata: JSON.stringify({
              sessionId: id,
              listingId: session.listingId,
              teacherId: session.teacherId,
            }),
          },
        });

        return updatedSession;
      });

      return success(result);
    }

    // CANCEL: Teacher can CANCEL PENDING, either party can CANCEL CONFIRMED
    if (status === "CANCELLED") {
      if (session.status === "COMPLETED") {
        return error(
          "INVALID_STATUS",
          "Cannot cancel a completed session"
        );
      }
      if (session.status === "CANCELLED") {
        return error(
          "INVALID_STATUS",
          "Session is already cancelled"
        );
      }

      // Only teacher can cancel PENDING sessions
      if (session.status === "PENDING" && session.teacherId !== user.id) {
        return forbidden("Only the teacher can cancel a pending session");
      }

      // Either party can cancel CONFIRMED sessions
      if (session.status === "CONFIRMED") {
        if (session.learnerId !== user.id && session.teacherId !== user.id) {
          return forbidden("Only the learner or teacher can cancel this session");
        }
      }

      const creditAmount = session.listing.creditCost;

      const result = await db.$transaction(async (tx) => {
        // Update session status
        const updatedSession = await tx.session.update({
          where: { id },
          data: { status: "CANCELLED" },
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

        // Refund credits: add back to learner balance
        await tx.user.update({
          where: { id: session.learnerId },
          data: { creditBalance: { increment: creditAmount } },
        });

        // Create REFUND transaction record
        await tx.transaction.create({
          data: {
            fromUserId: session.teacherId,
            toUserId: session.learnerId,
            amount: creditAmount,
            type: "REFUND",
            sessionId: id,
          },
        });

        // Determine who cancelled for the message
        const cancelledByName = user.name || "Someone";
        const isTeacher = user.id === session.teacherId;

        // Create SESSION_CANCELLED notification for learner
        await tx.notification.create({
          data: {
            userId: session.learnerId,
            type: "SESSION_CANCELLED",
            message: isTeacher
              ? `${cancelledByName} cancelled your session for "${session.listing.title}". ${creditAmount} credits have been refunded.`
              : `Your session for "${session.listing.title}" has been cancelled. ${creditAmount} credits have been refunded.`,
            metadata: JSON.stringify({
              sessionId: id,
              listingId: session.listingId,
              refundedAmount: creditAmount,
              cancelledBy: user.id,
            }),
          },
        });

        // If learner cancelled, notify teacher too
        if (!isTeacher) {
          await tx.notification.create({
            data: {
              userId: session.teacherId,
              type: "SESSION_CANCELLED",
              message: `${cancelledByName} cancelled their session for "${session.listing.title}"`,
              metadata: JSON.stringify({
                sessionId: id,
                listingId: session.listingId,
                cancelledBy: user.id,
              }),
            },
          });
        }

        return updatedSession;
      });

      return success(result);
    }

    // COMPLETED status is handled by the /complete endpoint
    if (status === "COMPLETED") {
      return error(
        "INVALID_OPERATION",
        "Use the /complete endpoint to mark a session as completed"
      );
    }

    return error("INVALID_STATUS", "Invalid status transition");
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("[PATCH /api/sessions/[id]/status]", err);
    return serverError();
  }
}
