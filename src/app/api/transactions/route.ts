import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";
import { transactionQuerySchema } from "@/lib/validators";
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
    const queryParams = transactionQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!queryParams.success) {
      return error("VALIDATION_ERROR", queryParams.error.issues[0].message);
    }

    const { type, cursor, limit } = queryParams.data;

    const where: Prisma.TransactionWhereInput = {
      OR: [{ fromUserId: user.id }, { toUserId: user.id }],
      ...(type && { type }),
    };

    const transactions = await db.transaction.findMany({
      where,
      include: {
        fromUser: {
          select: { id: true, name: true, avatar: true },
        },
        toUser: {
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

    const hasMore = transactions.length > limit;
    const transactionsPage = hasMore ? transactions.slice(0, limit) : transactions;
    const nextCursor = hasMore
      ? transactionsPage[transactionsPage.length - 1].createdAt.toISOString()
      : undefined;

    return paginatedResponse(transactionsPage, hasMore, nextCursor);
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("[GET /api/transactions]", err);
    return serverError();
  }
}
