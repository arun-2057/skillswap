import { db } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";
import { success, notFound, unauthorized, forbidden, serverError } from "@/lib/api-utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return notFound("Notification not found");
    }

    if (notification.userId !== user.id) {
      return forbidden("You can only mark your own notifications as read");
    }

    const updatedNotification = await db.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return success({
      id: updatedNotification.id,
      isRead: updatedNotification.isRead,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("[POST /api/notifications/[id]/read]", err);
    return serverError();
  }
}
