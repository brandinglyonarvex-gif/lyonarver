import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

const isProtectedRoute = (pathname: string) => {
  return (
    pathname.startsWith("/account") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/api/payments")
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip Kinde auth routes entirely
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  if (isProtectedRoute(pathname)) {
    const { isAuthenticated } = getKindeServerSession()
    
    if (!(await isAuthenticated())) {
      const signInUrl = new URL("/api/auth/login", request.url)
      signInUrl.searchParams.set("post_login_redirect_url", pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
}