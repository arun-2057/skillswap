import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";
import { success, error, unauthorized, serverError } from "@/lib/api-utils";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50).optional(),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  timezone: z.string().min(1, "Timezone is required").optional(),
  avatar: z.string().max(500, "Avatar URL must be under 500 characters").optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();

    return success({
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      timezone: user.timezone,
      creditBalance: user.creditBalance,
      skillsOffered: JSON.parse(user.skillsOffered),
      skillsWanted: JSON.parse(user.skillsWanted),
      averageRating: user.averageRating,
      isOnboarded: user.isOnboarded,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("[GET /api/users/me]", err);
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return error("VALIDATION_ERROR", parsed.error.issues[0].message);
    }

    const { name, bio, timezone, avatar } = parsed.data;

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(timezone !== undefined && { timezone }),
        ...(avatar !== undefined && { avatar }),
      },
    });

    return success({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
      timezone: updatedUser.timezone,
      creditBalance: updatedUser.creditBalance,
      skillsOffered: JSON.parse(updatedUser.skillsOffered),
      skillsWanted: JSON.parse(updatedUser.skillsWanted),
      averageRating: updatedUser.averageRating,
      isOnboarded: updatedUser.isOnboarded,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("[PUT /api/users/me]", err);
    return serverError();
  }
}
