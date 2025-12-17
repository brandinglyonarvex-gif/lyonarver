import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { getOrCreateUser } from "@/lib/kinde-db"

export async function GET() {
  try {
    const { getUser } = getKindeServerSession()
    const kindeUser = await getUser()

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getOrCreateUser(
      kindeUser.id,
      kindeUser.email || "",
      kindeUser.given_name || kindeUser.family_name || undefined
    )

    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            sizes: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(wishlist)
  } catch (error) {
    console.error("Failed to fetch wishlist:", error)
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession()
    const kindeUser = await getUser()

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    const user = await getOrCreateUser(
      kindeUser.id,
      kindeUser.email || "",
      kindeUser.given_name || kindeUser.family_name || undefined
    )

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ message: "Already in wishlist" }, { status: 200 })
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: user.id,
        productId,
      },
      include: {
        product: true,
      },
    })

    return NextResponse.json(wishlistItem)
  } catch (error) {
    console.error("Failed to add to wishlist:", error)
    return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 })
  }
}
