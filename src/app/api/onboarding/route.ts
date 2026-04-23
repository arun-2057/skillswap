import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";
import { completeOnboardingSchema } from "@/lib/validators";
import { success, error, unauthorized, serverError } from "@/lib/api-utils";

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const parsed = completeOnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return error("VALIDATION_ERROR", parsed.error.issues[0].message);
    }

    const { name, bio, timezone, skillsOffered, skillsWanted } = parsed.data;

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        name,
        bio,
        timezone,
        skillsOffered: JSON.stringify(skillsOffered),
        skillsWanted: JSON.stringify(skillsWanted),
        isOnboarded: true,
      },
    });

    return success({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      bio: updatedUser.bio,
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
    console.error("[PUT /api/onboarding]", err);
    return serverError();
  }
}
