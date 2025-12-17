import { prisma } from "@/lib/db";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q") || "";
    const categorySlug = searchParams.get("category");
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "1000000"); // A very large default
    const sortBy = searchParams.get("sort") || "relevance";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "9"); // Default to 9 as set in frontend
    const skip = (page - 1) * limit;

    const whereClause: any = {
      stock: { gt: 0 },
      category: {
        active: true,
      },
      price: {
        gte: minPrice,
        lte: maxPrice,
      },
    };

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    if (categorySlug) {
      whereClause.category = { ...whereClause.category, slug: categorySlug };
    }

    let orderByClause: any = { createdAt: "desc" }; // Default newest

    switch (sortBy) {
      case "price-low":
        orderByClause = { price: "asc" };
        break;
      case "price-high":
        orderByClause = { price: "desc" };
        break;
      case "rating":
        orderByClause = { rating: "desc" };
        break;
      case "newest":
        orderByClause = { createdAt: "desc" };
        break;
      case "relevance":
      default:
        // For relevance, we might rely on default or enhance with text search ranking if available
        orderByClause = {}; // No specific order for 'relevance' without search ranking
        break;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
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
      orderBy: orderByClause,
      skip: skip,
      take: limit,
    });

    const totalProducts = await prisma.product.count({
      where: whereClause,
    });

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
        featured: product.featured,
        sizes: product.sizes.map((s) => ({
          id: s.id,
          size: s.size,
          quantity: s.quantity,
        })),
      };
    });

    return NextResponse.json({ products: productsWithRating, totalProducts });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}