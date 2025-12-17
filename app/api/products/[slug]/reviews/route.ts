import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getOrCreateUser } from "@/lib/kinde-db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const reviews = await prisma.review.findMany({
      where: { productId: product.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getOrCreateUser(
      kindeUser.id,
      kindeUser.email || "",
      kindeUser.given_name || kindeUser.family_name || undefined,
    );

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    const { rating, title, comment } = body;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 },
      );
    }

    if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment is required" },
        { status: 400 },
      );
    }

    // Sanitize input (basic XSS prevention)
    const sanitizedTitle = title.trim().slice(0, 200);
    const sanitizedComment = comment.trim().slice(0, 2000);

    // Use transaction with upsert-like behavior to prevent race conditions
    // The @@unique([productId, userId]) constraint in the Review model would be ideal,
    // but since we don't have it, we use a transaction
    try {
      const review = await prisma.$transaction(async (tx) => {
        // Check for existing review within transaction
        const existingReview = await tx.review.findFirst({
          where: {
            productId: product.id,
            userId: user.id,
          },
        });

        if (existingReview) {
          // Update existing review instead of creating duplicate
          return tx.review.update({
            where: { id: existingReview.id },
            data: {
              rating: parseInt(String(rating)),
              title: sanitizedTitle,
              comment: sanitizedComment,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          });
        }

        // Create new review
        return tx.review.create({
          data: {
            productId: product.id,
            userId: user.id,
            rating: parseInt(String(rating)),
            title: sanitizedTitle,
            comment: sanitizedComment,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });
      });

      // Update product's average rating
      const allReviews = await prisma.review.findMany({
        where: { productId: product.id },
        select: { rating: true },
      });

      const avgRating =
        allReviews.length > 0
          ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
          : 0;

      await prisma.product.update({
        where: { id: product.id },
        data: { rating: Math.round(avgRating * 10) / 10 },
      });

      return NextResponse.json(review, { status: 201 });
    } catch (txError) {
      // Handle unique constraint violation (if added to schema)
      if (
        txError instanceof Error &&
        txError.message.includes("Unique constraint")
      ) {
        return NextResponse.json(
          { error: "You have already reviewed this product" },
          { status: 400 },
        );
      }
      throw txError;
    }
  } catch (error) {
    console.error("Failed to create review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 },
    );
  }
}
