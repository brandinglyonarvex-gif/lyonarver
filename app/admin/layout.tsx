"use client"

import type React from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, Menu, X, ChevronLeft } from "lucide-react"
import { useState, useEffect } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [adminUser, setAdminUser] = useState<{ email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // Skip auth check for login page
  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    if (!isLoginPage) {
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [isLoginPage])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/me")
      if (response.ok) {
        const data = await response.json()
        setAdminUser(data)
      } else {
        router.push("/admin/login")
      }
    } catch (error) {
      router.push("/admin/login")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      router.push("/admin/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // If on login page, render children directly without layout
  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 relative animate-spin">
            <div className="w-full h-full border-4 border-gray-300 border-t-black rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <div className="w-4 h-4 bg-black rounded-full"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null // Will redirect to login
  }

  const adminLinks = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Categories", href: "/admin/categories", icon: Package },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Cover Photos", href: "/admin/cover-photos", icon: Package },
    { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { label: "Users", href: "/admin/users", icon: Users },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-black to-gray-900 text-white transition-all duration-300 hidden lg:flex flex-col fixed h-full shadow-2xl z-40`}
      >
        <div className="p-6 border-b border-gray-800 relative">
          <div className="flex items-center justify-between">
            <h2 className={`font-bold transition-all ${sidebarOpen ? "text-xl" : "text-sm text-center w-full"}`}>
              {sidebarOpen ? "LyonArvex Admin" : "LA"}
            </h2>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-white/10 rounded-full transition-all duration-300 hover:bg-white/20 absolute -right-4 top-1/2 -translate-y-1/2 hidden lg:block"
          >
            <ChevronLeft
              size={20}
              className={`transition-transform duration-300 ${
                sidebarOpen ? "" : "rotate-180"
              }`}
            />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 mb-2 group ${
                  isActive
                    ? "bg-white/20 shadow-lg"
                    : "hover:bg-white/10"
                }`}
              >
                <div className="relative">
                  <Icon
                    size={20}
                    className="group-hover:scale-110 transition-transform"
                  />
                  {isActive && (
                    <div className="absolute -left-4 top-0 h-full w-1 bg-white rounded-r-full"></div>
                  )}
                </div>
                {sidebarOpen && (
                  <span className="font-medium">{link.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="mb-4 px-4 py-3 bg-white/5 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
              <span className="text-lg font-bold">
                {adminUser.email[0].toUpperCase()}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-md font-semibold truncate">Administrator</p>
                <p className="text-sm text-gray-400 truncate">{adminUser.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all duration-300 group"
          >
            <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-black to-gray-900 text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-lg">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="font-bold text-lg">Admin Dashboard</h1>
          <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <LogOut size={20} />
          </button>
        </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      ></div>
      <div
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-gray-900 to-black text-white w-64 p-4 space-y-2 shadow-xl z-50 transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <h2 className="font-bold text-xl">LyonArvex Admin</h2>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        {adminLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300"
            >
              <Icon size={20} />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
        <div className="pt-4 mt-4 border-t border-gray-800">
          <div className="px-4 py-2 flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
              <span className="text-sm font-bold">
                {adminUser.email[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Admin</p>
              <p className="text-xs text-gray-400 truncate">{adminUser.email}</p>
            </div>
          </div>
        </div>
      </div>

        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
