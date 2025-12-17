import { prisma } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/kinde-db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await getOrCreateUser(
      kindeUser.id,
      kindeUser.email || "",
      kindeUser.given_name || "",
    );

    const { orderNumber } = await params;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        shippingAddress: true,
        user: true,
      },
    });

    // Security check: ensure the order belongs to the logged-in user
    if (!order || order.userId !== user.id) {
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
