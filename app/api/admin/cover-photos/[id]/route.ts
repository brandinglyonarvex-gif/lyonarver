import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const body = await request.json()
    const { title, subtitle, imageUrl, link, order, active } = body

    const photo = await prisma.coverPhoto.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title || null }),
        ...(subtitle !== undefined && { subtitle: subtitle || null }),
        ...(imageUrl && { imageUrl }),
        ...(link !== undefined && { link: link || null }),
        ...(order !== undefined && { order }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json(photo)
  } catch (error) {
    console.error("Cover photo update error:", error)
    return NextResponse.json({ error: "Failed to update cover photo" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    await prisma.coverPhoto.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Cover photo deletion error:", error)
    return NextResponse.json({ error: "Failed to delete cover photo" }, { status: 500 })
  }
}






