import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { NextResponse } from "next/server"
import { getOrCreateUser } from "@/lib/kinde-db"

export async function GET() {
  try {
    const { getUser } = getKindeServerSession()
    const kindeUser = await getUser()

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = await getOrCreateUser(
      kindeUser.id,
      kindeUser.email || "",
      kindeUser.given_name || kindeUser.family_name || undefined,
      kindeUser.picture || undefined
    )

    return NextResponse.json({
      id: user.id,
      kindeId: user.kindeId,
      email: user.email,
      name: user.name,
      phone: user.phone,
      image: user.image,
      createdAt: user.createdAt.toISOString(),
    })
  } catch (error) {
    console.error("Failed to fetch user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
