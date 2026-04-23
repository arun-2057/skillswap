import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/api-utils";

export async function getAuthUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });
  return user;
}

export async function requireAuth() {
  const user = await getAuthUser();
  if (!user) {
    throw new AuthError("Authentication required");
  }
  return user;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
