import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { type NextRequest, NextResponse } from "next/server";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: {
            product: true,
            size: true,
          },
        },
        shippingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { status } = body as { status: OrderStatus };

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    if (!ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get current order to check previous status
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            size: true,
          },
        },
      },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If cancelling an order that wasn't already cancelled, restore stock
    if (status === "cancelled" && currentOrder.status !== "cancelled") {
      const order = await prisma.$transaction(async (tx) => {
        // Restore stock for each item
        for (const item of currentOrder.items) {
          if (item.sizeId) {
            // Restore size-specific stock
            await tx.productSize.update({
              where: { id: item.sizeId },
              data: { quantity: { increment: item.quantity } },
            });
          }

          // Restore product-level stock (always, since we decrement it for all orders)
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }

        // Update order status
        return tx.order.update({
          where: { id },
          data: {
            status,
            paymentStatus:
              currentOrder.paymentStatus === "completed" ? "refunded" : "failed",
          },
          include: { user: true, items: true, shippingAddress: true },
        });
      });

      return NextResponse.json(order);
    }

    // For other status changes, just update the status
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { user: true, items: true, shippingAddress: true },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}
