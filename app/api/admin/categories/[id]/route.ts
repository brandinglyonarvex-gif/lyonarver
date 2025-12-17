import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { type NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const { name, description, image, showOnLanding, active, order } = body;

    const updateData: any = {};
    if (name) {
      updateData.name = name;
      updateData.slug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    }
    if (description !== undefined) updateData.description = description || null;
    if (image !== undefined) updateData.image = image || null;
    if (showOnLanding !== undefined) updateData.showOnLanding = showOnLanding;
    if (active !== undefined) updateData.active = active;
    if (order !== undefined) updateData.order = order;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Category update error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update category",
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

    // The schema's `onDelete: Cascade` on the Category->Product relation
    // will handle deleting all products in this category, which will then
    // trigger the cascading deletes for their related models.
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Category deletion error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete category",
      },
      { status: 500 },
    );
  }
}
