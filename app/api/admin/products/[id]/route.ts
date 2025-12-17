import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        sizes: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
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

    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Find or create category
      let category = await tx.category.findFirst({
        where: { slug: categoryId?.toLowerCase() },
      });

      if (categoryId && !category) {
        category = await tx.category.create({
          data: {
            name: categoryId,
            slug: categoryId.toLowerCase().replace(/\s+/g, "-"),
          },
        });
      }

      // Calculate total stock from the new sizes array
      const totalStock =
        sizes?.reduce(
          (sum: number, s: { quantity: number }) => sum + (s.quantity || 0),
          0,
        ) || 0;

      // 1. Update product details
      await tx.product.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(name && {
            slug: name
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, ""),
          }),
          ...(description && { description }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(discount !== undefined && { discount: parseFloat(discount) }),
          ...(categoryId && category && { categoryId: category.id }),
          ...(images && { images }),
          ...(featured !== undefined && { featured }),
          stock: totalStock, // Always update stock based on new sizes
        },
      });

      // 2. Delete all existing sizes for the product
      if (sizes && Array.isArray(sizes)) {
        await tx.productSize.deleteMany({
          where: { productId: id },
        });

        // 3. Create new sizes from the provided array
        if (sizes.length > 0) {
          await tx.productSize.createMany({
            data: sizes.map((s: { size: string; quantity: number | string }) => ({
              productId: id,
              size: s.size.trim(),
              quantity:
                typeof s.quantity === "string"
                  ? parseInt(s.quantity, 10) || 0
                  : Number(s.quantity) || 0,
            })),
          });
        }
      }

      // 4. Return the fully updated product
      return tx.product.findUnique({
        where: { id },
        include: {
          category: true,
          sizes: true,
        },
      });
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update product",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // The schema handles cascading deletes for ProductSize, WishlistItem, and Review.
    // It also handles setting OrderItem.productId to null.
    // Therefore, we can just delete the product directly.
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product deletion error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete product",
      },
      { status: 500 },
    );
  }
}
