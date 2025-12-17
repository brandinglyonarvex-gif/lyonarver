import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { productIds } = await request.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ validProductIds: [] });
    }

    // Find all products that exist in the database
    const existingProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: { id: true },
    });

    const validProductIds = existingProducts.map((p) => p.id);

    return NextResponse.json({ validProductIds });
  } catch (error) {
    console.error("Error validating products:", error);
    return NextResponse.json(
      { error: "Failed to validate products" },
      { status: 500 }
    );
  }
}
