import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await requireAdmin()

    const [products, orders, users, totalRevenue] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: "completed" },
      }),
    ])

    return NextResponse.json({
      totalProducts: products,
      totalOrders: orders,
      totalUsers: users,
      totalRevenue: totalRevenue._sum.total || 0,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
