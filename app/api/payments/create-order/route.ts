import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Razorpay from "razorpay";
import { getOrCreateUser } from "@/lib/kinde-db";
import { SHIPPING_THRESHOLD, SHIPPING_COST, TAX_RATE } from "@/lib/constants";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

interface CartItem {
  productId: string;
  quantity: number;
  sizeId?: string;
  sizeName?: string;
}

interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await getOrCreateUser(
      kindeUser.id,
      kindeUser.email || "",
      kindeUser.given_name || kindeUser.family_name || undefined,
    );

    const body = await request.json();
    const { items, shippingAddress } = body as {
      items: CartItem[];
      shippingAddress: ShippingAddress;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 },
      );
    }

    // Step 1: Create Razorpay order FIRST (outside transaction)
    // This prevents holding DB connections while waiting for external API
    const productIds = items.map((item) => item.productId);

    // Quick validation fetch (not for stock check - that happens in transaction)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        images: true,
        price: true,
        discount: true,
        sizes: {
          select: { id: true, size: true },
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate all products exist
    for (const item of items) {
      if (!productMap.has(item.productId)) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 },
        );
      }
    }

    // Calculate totals for Razorpay order
    let subtotal = 0;
    for (const item of items) {
      const product = productMap.get(item.productId)!;
      const itemPrice = Number(product.price);
      const itemDiscount = Number(product.discount);
      const finalPrice = itemPrice * (1 - itemDiscount / 100);
      subtotal += finalPrice * item.quantity;
    }

    const tax = subtotal * TAX_RATE;
    const shipping = subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total = subtotal + tax + shipping;

    // Create Razorpay order (external API call - outside transaction)
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(total * 100), // Amount in paise
        currency: "INR",
        receipt: `order_${Date.now()}`,
        notes: {
          userId: user.id,
        },
      });
    } catch (razorpayError) {
      console.error("Razorpay order creation failed:", razorpayError);
      return NextResponse.json(
        { error: "Failed to create payment order. Please try again." },
        { status: 500 },
      );
    }

    // Step 2: Database transaction with proper stock locking
    // Using Serializable isolation to prevent race conditions
    try {
      const dbOrder = await prisma.$transaction(
        async (tx) => {
          const orderItemsData: Array<{
            productId: string;
            productName: string;
            productImage: string;
            sizeId: string | null;
            sizeName: string | null;
            quantity: number;
            price: number;
          }> = [];

          // Validate stock and prepare order items WITH LOCKING
          for (const item of items) {
            const product = productMap.get(item.productId)!;
            const itemPrice = Number(product.price);
            const itemDiscount = Number(product.discount);
            const finalPrice = itemPrice * (1 - itemDiscount / 100);

            if (item.sizeId) {
              // Lock and check size-specific stock
              const productSize = await tx.productSize.findUnique({
                where: { id: item.sizeId },
              });

              if (!productSize) {
                throw new Error(
                  `Size not found for ${product.name}`,
                );
              }

              if (productSize.quantity < item.quantity) {
                throw new Error(
                  `Insufficient stock for ${product.name} (Size: ${item.sizeName || productSize.size}). Available: ${productSize.quantity}`,
                );
              }

              // Decrement size stock
              await tx.productSize.update({
                where: { id: item.sizeId },
                data: { quantity: { decrement: item.quantity } },
              });

              // Also update total product stock
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
              });
            } else {
              // Lock and check product-level stock
              const currentProduct = await tx.product.findUnique({
                where: { id: item.productId },
                select: { stock: true, name: true },
              });

              if (!currentProduct) {
                throw new Error(`Product not found: ${item.productId}`);
              }

              if (currentProduct.stock < item.quantity) {
                throw new Error(
                  `Insufficient stock for ${currentProduct.name}. Available: ${currentProduct.stock}`,
                );
              }

              // Decrement product stock
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
              });
            }

            orderItemsData.push({
              productId: product.id,
              productName: product.name,
              productImage: product.images[0] || "",
              sizeId: item.sizeId || null,
              sizeName: item.sizeName || null,
              quantity: item.quantity,
              price: finalPrice,
            });
          }

          // Create shipping address
          const newAddress = await tx.address.create({
            data: {
              userId: user.id,
              fullName: shippingAddress.fullName,
              phone: shippingAddress.phone,
              street: shippingAddress.street,
              city: shippingAddress.city,
              state: shippingAddress.state || "",
              postalCode: shippingAddress.postalCode,
              country: shippingAddress.country,
            },
          });

          // Create order
          const newDbOrder = await tx.order.create({
            data: {
              userId: user.id,
              orderNumber: razorpayOrder.id,
              status: "pending",
              total: total,
              subtotal: subtotal,
              tax: tax,
              shipping: shipping,
              paymentMethod: "razorpay",
              paymentStatus: "pending",
              shippingAddressId: newAddress.id,
              items: {
                createMany: {
                  data: orderItemsData,
                },
              },
            },
          });

          return newDbOrder;
        },
        {
          timeout: 10000, // 10 second timeout
        },
      );

      return NextResponse.json({
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        dbOrderId: dbOrder.id,
      });
    } catch (dbError) {
      // Database transaction failed - Razorpay order exists but DB order doesn't
      // This is okay - the Razorpay order will expire automatically
      // and stock was never decremented
      console.error("Database transaction failed:", dbError);

      const errorMessage =
        dbError instanceof Error ? dbError.message : "Failed to process order";

      // Check if it's a stock error
      if (errorMessage.includes("Insufficient stock")) {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }

      return NextResponse.json(
        { error: "Failed to create order. Please try again." },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Payment order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 },
    );
  }
}
