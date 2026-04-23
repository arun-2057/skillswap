import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      success: true,
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
        db: "connected",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DB_ERROR",
          message: "Database connection failed",
        },
      },
      { status: 503 }
    );
  }
}
