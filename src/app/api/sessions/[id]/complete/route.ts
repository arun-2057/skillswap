import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";
import { success, notFound, unauthorized, forbidden, error, serverError } from "@/lib/api-utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const session = await db.session.findUnique({
      where: { id },
      include: {
        listing: true,
        teacher: true,
      },
    });

    if (!session) {
      return notFound("Session not found");
    }

    // Teacher only
    if (session.teacherId !== user.id) {
      return forbidden("Only the teacher can mark a session as complete");
    }

    // Status must be CONFIRMED
    if (session.status !== "CONFIRMED") {
      return error(
        "INVALID_STATUS",
        "Session must be confirmed before it can be completed"
      );
    }

    // Use transaction to release credits to teacher
    const result = await db.$transaction(async (tx) => {
      // Update session status to COMPLETED
      const updatedSession = await tx.session.update({
        where: { id },
        data: { status: "COMPLETED" },
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

      const creditAmount = session.listing.creditCost;

      // Release credits: add to teacher balance
      const updatedTeacher = await tx.user.update({
        where: { id: session.teacherId },
        data: { creditBalance: { increment: creditAmount } },
      });

      // Create EARN transaction record
      await tx.transaction.create({
        data: {
          fromUserId: session.learnerId,
          toUserId: session.teacherId,
          amount: creditAmount,
          type: "EARN",
          sessionId: id,
        },
      });

      // Create CREDIT_RECEIVED notification for teacher
      await tx.notification.create({
        data: {
          userId: session.teacherId,
          type: "CREDIT_RECEIVED",
          message: `You earned ${creditAmount} credits for completing "${session.listing.title}"`,
          metadata: JSON.stringify({
            sessionId: id,
            amount: creditAmount,
            listingId: session.listingId,
          }),
        },
      });

      // Check teacher's balance for LOW_BALANCE notification
      if (updatedTeacher.creditBalance < 10) {
        await tx.notification.create({
          data: {
            userId: session.teacherId,
            type: "LOW_BALANCE",
            message: `Your credit balance is low (${updatedTeacher.creditBalance} credits). Consider listing your skills to earn more.`,
            metadata: JSON.stringify({
              balance: updatedTeacher.creditBalance,
            }),
          },
        });
      }

      return updatedSession;
    });

    return success(result);
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("[POST /api/sessions/[id]/complete]", err);
    return serverError();
  }
}
