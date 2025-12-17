import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        featured: true,
        stock: { gt: 0 },
        category: {
          active: true,
        },
      },
      include: {
        category: true,
        sizes: {
          where: {
            quantity: { gt: 0 },
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8, // Limit to 8 featured products
    });

    // Calculate average rating for each product
    const productsWithRating = products.map((product) => {
      const avgRating =
        product.reviews.length > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
            product.reviews.length
          : product.rating || 0;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        discount: product.discount,
        rating: Math.round(avgRating * 10) / 10,
        images: product.images,
        category: product.category.name,
        stock: product.stock,
        sizes: product.sizes.map((s) => ({
          id: s.id,
          size: s.size,
          quantity: s.quantity,
        })),
      };
    });

    return NextResponse.json(productsWithRating);
  } catch (error) {
    console.error("Failed to fetch featured products:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured products" },
      { status: 500 },
    );
  }
}
