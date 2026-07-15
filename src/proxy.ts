import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiLimiter, strictLimiter } from "@/lib/rate-limit";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Isolate the rate limiter to only track API endpoints
  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 2. Derive a unique identifier for the user (IP Address)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

  try {
    let limitResult;

    // 3. Match specific route sub-paths to their corresponding policy
    if (pathname.startsWith("/api/search") || pathname.startsWith("/api/notifications")) {
      limitResult = await apiLimiter.limit(`api:${ip}`);
    } else {
      // Catch-all fallback for other API endpoints/booking triggers
      limitResult = await strictLimiter.limit(`strict:${ip}`);
    }

    const { success, limit, reset, remaining } = limitResult;

    // 4. Handle Rate Limit Exceeded (HTTP 429)
    if (!success) {
      return new NextResponse(
        JSON.stringify({
          error: "Too Many Requests",
          message: "You have exceeded your skill-swapping request quota. Please slow down.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }

    // 5. Append rate limit health headers to successful responses
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());

    return response;

  } catch (error) {
    // Fail-open strategy: If Upstash falls over, don't crash your entire user-facing app
    console.error("Rate limiting tracking exception:", error);
    return NextResponse.next();
  }
}

// Ensure the middleware strictly intercepts API paths to prevent slowing down static pages
export const config = {
  matcher: ["/api/:path*"],
};
