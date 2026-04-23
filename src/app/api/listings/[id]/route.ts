import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";
import { updateListingSchema } from "@/lib/validators";
import {
  success,
  error,
  notFound,
  unauthorized,
  forbidden,
  serverError,
} from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await db.skillListing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
            averageRating: true,
          },
        },
      },
    });

    if (!listing) {
      return notFound("Listing not found");
    }

    return success({
      id: listing.id,
      title: listing.title,
      category: listing.category,
      tags: JSON.parse(listing.tags),
      description: listing.description,
      creditCost: listing.creditCost,
      availability: listing.availability,
      isActive: listing.isActive,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      user: listing.user,
    });
  } catch (err) {
    console.error("[GET /api/listings/[id]]", err);
    return serverError();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const listing = await db.skillListing.findUnique({ where: { id } });

    if (!listing) {
      return notFound("Listing not found");
    }

    if (listing.userId !== user.id) {
      return forbidden("You can only update your own listings");
    }

    const body = await request.json();
    const parsed = updateListingSchema.safeParse(body);

    if (!parsed.success) {
      return error("VALIDATION_ERROR", parsed.error.issues[0].message);
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.category !== undefined) data.category = parsed.data.category;
    if (parsed.data.tags !== undefined) data.tags = JSON.stringify(parsed.data.tags);
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.creditCost !== undefined) data.creditCost = parsed.data.creditCost;
    if (parsed.data.availability !== undefined) data.availability = parsed.data.availability;

    const updatedListing = await db.skillListing.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            averageRating: true,
          },
        },
      },
    });

    return success({
      id: updatedListing.id,
      title: updatedListing.title,
      category: updatedListing.category,
      tags: JSON.parse(updatedListing.tags),
      description: updatedListing.description,
      creditCost: updatedListing.creditCost,
      availability: updatedListing.availability,
      isActive: updatedListing.isActive,
      createdAt: updatedListing.createdAt,
      updatedAt: updatedListing.updatedAt,
      user: updatedListing.user,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("[PUT /api/listings/[id]]", err);
    return serverError();
  }
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const listing = await db.skillListing.findUnique({ where: { id } });

    if (!listing) {
      return notFound("Listing not found");
    }

    if (listing.userId !== user.id) {
      return forbidden("You can only modify your own listings");
    }

    const updatedListing = await db.skillListing.update({
      where: { id },
      data: { isActive: !listing.isActive },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            averageRating: true,
          },
        },
      },
    });

    return success({
      id: updatedListing.id,
      title: updatedListing.title,
      category: updatedListing.category,
      tags: JSON.parse(updatedListing.tags),
      description: updatedListing.description,
      creditCost: updatedListing.creditCost,
      availability: updatedListing.availability,
      isActive: updatedListing.isActive,
      createdAt: updatedListing.createdAt,
      updatedAt: updatedListing.updatedAt,
      user: updatedListing.user,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("[PATCH /api/listings/[id]]", err);
    return serverError();
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const listing = await db.skillListing.findUnique({ where: { id } });

    if (!listing) {
      return notFound("Listing not found");
    }

    if (listing.userId !== user.id) {
      return forbidden("You can only delete your own listings");
    }

    const updatedListing = await db.skillListing.update({
      where: { id },
      data: { isActive: false },
    });

    return success({
      id: updatedListing.id,
      isActive: updatedListing.isActive,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("[DELETE /api/listings/[id]]", err);
    return serverError();
  }
}
