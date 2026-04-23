import { NextResponse } from "next/server";

type ApiSuccessResponse<T> = { success: true; data: T };
type ApiErrorResponse = { success: false; error: { code: string; message: string } };

export function success<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function error(code: string, message: string, status = 400): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

export function serverError(message = "Something went wrong. Please try again."): NextResponse<ApiErrorResponse> {
  return error("INTERNAL_ERROR", message, 500);
}

export function notFound(message = "Resource not found"): NextResponse<ApiErrorResponse> {
  return error("NOT_FOUND", message, 404);
}

export function unauthorized(message = "Authentication required"): NextResponse<ApiErrorResponse> {
  return error("UNAUTHORIZED", message, 401);
}

export function forbidden(message = "You do not have permission to perform this action"): NextResponse<ApiErrorResponse> {
  return error("FORBIDDEN", message, 403);
}

export function paginatedResponse<T>(
  items: T[],
  hasMore: boolean,
  nextCursor?: string
): NextResponse<{ success: true; data: T[]; hasMore: boolean; nextCursor?: string }> {
  return NextResponse.json({ success: true, data: items, hasMore, nextCursor });
}
