import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { getOrCreateUser } from "@/lib/kinde-db"

export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession()
    const kindeUser = await getUser()

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = await getOrCreateUser(
      kindeUser.id,
      kindeUser.email || "",
      kindeUser.given_name || kindeUser.family_name || undefined
    )

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Failed to fetch orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
