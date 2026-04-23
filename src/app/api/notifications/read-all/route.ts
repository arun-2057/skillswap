import { db } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";
import { success, unauthorized, serverError } from "@/lib/api-utils";

export async function POST() {
  try {
    const user = await requireAuth();

    await db.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return success({ marked: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("[POST /api/notifications/read-all]", err);
    return serverError();
  }
}
