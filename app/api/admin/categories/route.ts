import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    await requireAdmin()

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { name, description, image, showOnLanding, order } = body

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

    // Check if slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json({ error: "Category with this name already exists" }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        showOnLanding: showOnLanding || false,
        order: order ?? 0,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Category creation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create category" },
      { status: 500 }
    )
  }
}






