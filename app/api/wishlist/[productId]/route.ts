import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { getOrCreateUser } from "@/lib/kinde-db"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
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

    await prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to remove from wishlist:", error)
    return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 })
  }
}
