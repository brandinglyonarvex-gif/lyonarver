import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

// Hardcoded admin credentials
const ADMIN_EMAIL = "admin@lyonarvex.com"
const ADMIN_PASSWORD = "admin123"
const JWT_SECRET = process.env.JWT_SECRET || "admin-secret-key-change-in-production"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Validate credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        email: ADMIN_EMAIL,
        role: "admin",
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: { email: ADMIN_EMAIL, role: "admin" }
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    )
  }
}






