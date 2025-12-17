import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    // Verify signature
    const hmac = crypto.createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET || "",
    );
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const hash = hmac.digest("hex");

    if (hash !== razorpaySignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Update order status
    const order = await prisma.order.update({
      where: { orderNumber: razorpayOrderId },
      data: {
        paymentStatus: "completed",
        status: "confirmed",
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 },
    );
  }
}
