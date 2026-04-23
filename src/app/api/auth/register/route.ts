import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues.map((i) => i.message).join(", "),
          },
        },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMAIL_EXISTS",
            message: "An account with this email already exists",
          },
        },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        creditBalance: 100,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[REGISTER_ERROR]", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Something went wrong. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
