import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const photos = await prisma.coverPhoto.findMany({
      where: {
        active: true,
      },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(photos)
  } catch (error) {
    console.error("Failed to fetch cover photos:", error)
    return NextResponse.json({ error: "Failed to fetch cover photos" }, { status: 500 })
  }
}

