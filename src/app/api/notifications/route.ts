import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";
import { notificationQuerySchema } from "@/lib/validators";
import {
  error,
  unauthorized,
  serverError,
  paginatedResponse,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const queryParams = notificationQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!queryParams.success) {
      return error("VALIDATION_ERROR", queryParams.error.issues[0].message);
    }

    const { cursor, limit } = queryParams.data;

    const notifications = await db.notification.findMany({
      where: {
        userId: user.id,
        ...(cursor && { createdAt: { lt: new Date(cursor) } }),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = notifications.length > limit;
    const notificationsPage = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore
      ? notificationsPage[notificationsPage.length - 1].createdAt.toISOString()
      : undefined;

    // Parse metadata from JSON
    const formattedNotifications = notificationsPage.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      metadata: JSON.parse(n.metadata),
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));

    return paginatedResponse(formattedNotifications, hasMore, nextCursor);
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("[GET /api/notifications]", err);
    return serverError();
  }
}
