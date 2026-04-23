import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";
import { listingQuerySchema, createListingSchema } from "@/lib/validators";
import {
  success,
  error,
  unauthorized,
  serverError,
  paginatedResponse,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = listingQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!queryParams.success) {
      return error("VALIDATION_ERROR", queryParams.error.issues[0].message);
    }

    const {
      search,
      category,
      tags,
      minCredits,
      maxCredits,
      sort,
      cursor,
      limit,
    } = queryParams.data;

    // Build where clause
    const where: Prisma.SkillListingWhereInput = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim());
      for (const tag of tagList) {
        where.tags = { contains: tag };
      }
    }

    if (minCredits !== undefined || maxCredits !== undefined) {
      where.creditCost = {
        ...(minCredits !== undefined && { gte: minCredits }),
        ...(maxCredits !== undefined && { lte: maxCredits }),
      };
    }

    // Build orderBy
    let orderBy: Prisma.SkillListingOrderByWithRelationInput = {
      createdAt: "desc",
    };

    if (sort === "highest_rated") {
      orderBy = {
        user: { averageRating: "desc" },
      };
    } else if (sort === "lowest_cost") {
      orderBy = {
        creditCost: "asc",
      };
    }

    // Cursor-based pagination
    const listings = await db.skillListing.findMany({
      where,
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
      orderBy,
      take: limit + 1,
      ...(cursor && {
        cursor: { createdAt: new Date(cursor) },
        skip: 1,
      }),
    });

    const hasMore = listings.length > limit;
    const listingsPage = hasMore ? listings.slice(0, limit) : listings;
    const nextCursor = hasMore
      ? listingsPage[listingsPage.length - 1].createdAt.toISOString()
      : undefined;

    const formattedListings = listingsPage.map((listing) => ({
      id: listing.id,
      title: listing.title,
      category: listing.category,
      tags: JSON.parse(listing.tags),
      description: listing.description,
      creditCost: listing.creditCost,
      availability: listing.availability,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      user: listing.user,
    }));

    return paginatedResponse(formattedListings, hasMore, nextCursor);
  } catch (err) {
    console.error("[GET /api/listings]", err);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const parsed = createListingSchema.safeParse(body);

    if (!parsed.success) {
      return error("VALIDATION_ERROR", parsed.error.issues[0].message);
    }

    const { title, category, tags, description, creditCost, availability } =
      parsed.data;

    const listing = await db.skillListing.create({
      data: {
        userId: user.id,
        title,
        category,
        tags: JSON.stringify(tags),
        description,
        creditCost,
        availability,
      },
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

    return success(
      {
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
      },
      201
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(err.message);
    }
    console.error("[POST /api/listings]", err);
    return serverError();
  }
}
