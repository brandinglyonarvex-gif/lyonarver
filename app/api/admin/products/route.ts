import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { type NextRequest, NextResponse } from "next/server";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE))),
    );
    const search = searchParams.get("search");
    const categoryId = searchParams.get("category");
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          sizes: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + products.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      name,
      description,
      price,
      discount,
      categoryId,
      images,
      sizes,
      featured,
    } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 },
      );
    }

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Product description is required" },
        { status: 400 },
      );
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 },
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 },
      );
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 },
      );
    }

    if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
      return NextResponse.json(
        { error: "At least one size is required" },
        { status: 400 },
      );
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 400 },
      );
    }

    // Calculate total stock
    const totalStock = sizes.reduce(
      (sum: number, s: { quantity: number }) => sum + (Number(s.quantity) || 0),
      0,
    );

    // Generate slug
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // Check for existing slug and make unique if needed
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug,
        description: description.trim(),
        price: parseFloat(price),
        discount: parseFloat(discount) || 0,
        categoryId: category.id,
        stock: totalStock,
        images: images.filter((img: string) => typeof img === "string" && img.trim()),
        featured: Boolean(featured),
        sizes: {
          create: sizes
            .filter((s: { size: string }) => s.size && s.size.trim())
            .map((s: { size: string; quantity: number }) => ({
              size: s.size.trim(),
              quantity: Number(s.quantity) || 0,
            })),
        },
      },
      include: {
        sizes: true,
        category: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create product",
      },
      { status: 500 },
    );
  }
}
