import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await prisma.product.findUnique({
      where: {
        slug,
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Calculate average rating
    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : product.rating || 0

    return NextResponse.json({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discount: product.discount,
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: product.reviews.length,
      images: product.images,
      description: product.description,
      category: product.category.name,
      stock: product.stock,
      sizes: product.sizes.map(s => ({
        id: s.id,
        size: s.size,
        quantity: s.quantity,
      })),
      reviews: product.reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        createdAt: r.createdAt,
        user: r.user
          ? {
              id: r.user.id,
              name: r.user.name,
              email: r.user.email,
              image: r.user.image,
            }
          : null,
      })),
    })
  } catch (error) {
    console.error("Failed to fetch product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

