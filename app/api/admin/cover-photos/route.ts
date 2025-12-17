import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    await requireAdmin()

    const photos = await prisma.coverPhoto.findMany({
      orderBy: { order: "asc" },
    })

    return NextResponse.json(photos)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cover photos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { title, subtitle, imageUrl, link, order, active } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      )
    }

    const photo = await prisma.coverPhoto.create({
      data: {
        title: title || null,
        subtitle: subtitle || null,
        imageUrl,
        link: link || null,
        order: order ?? 0,
        active: active ?? true,
      },
    })

    return NextResponse.json(photo)
  } catch (error) {
    console.error("Cover photo creation error:", error)
    return NextResponse.json({ error: "Failed to create cover photo" }, { status: 500 })
  }
}






