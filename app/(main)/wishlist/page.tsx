"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { useRouter } from "next/navigation"

interface WishlistProduct {
  id: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    discount: number
    images: string[]
    stock: number
    sizes: Array<{ id: string; size: string; quantity: number }>
  }
}

export default function WishlistPage() {
  const { user, isAuthenticated, isLoading } = useKindeBrowserClient()
  const router = useRouter()
  const [wishlist, setWishlist] = useState<WishlistProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (!isAuthenticated) {
      setLoading(false)
      router.push("/api/auth/login?post_login_redirect_url=/wishlist")
      return
    }

    if (user) {
      fetchWishlist()
    }
  }, [user, isAuthenticated, isLoading, router])

  const fetchWishlist = async () => {
    try {
      const response = await fetch("/api/wishlist")
      if (response.ok) {
        const data = await response.json()
        setWishlist(data)
      }
    } catch (error) {
      console.error("Failed to fetch wishlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (productId: string) => {
    try {
      const response = await fetch(`/api/wishlist/${productId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setWishlist(wishlist.filter((item) => item.product?.id !== productId))
      }
    } catch (error) {
      console.error("Failed to remove from wishlist:", error)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-black mb-4"></div>
          <p className="text-gray-600">Loading wishlist...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link href="/" className="text-gray-600 hover:text-black transition-colors">
                  Home
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-black font-medium">Wishlist</li>
            </ol>
          </nav>
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
              My Wishlist
            </h1>
          </div>
          <p className="text-gray-600">
            {wishlist.length === 0
              ? "Your wishlist is empty"
              : `${wishlist.length} ${wishlist.length === 1 ? "item" : "items"} saved`}
          </p>
        </div>

        {/* Wishlist Items */}
        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.filter((item) => item.product != null).map((item) => {
              const product = item.product!
              const finalPrice = Number(product.price) * (1 - Number(product.discount) / 100)
              const hasStock = product.stock > 0

              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-2xl border-2 border-gray-200 hover:border-black transition-all duration-300 overflow-hidden shadow-md hover:shadow-2xl"
                >
                  <Link href={`/products/${product.slug}`} className="block">
                    <div className="relative h-64 bg-gray-100 overflow-hidden">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
                      )}
                      {product.discount > 0 && (
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg">
                          -{product.discount}%
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                            hasStock
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {hasStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="p-5">
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="font-bold text-lg mb-2 group-hover:text-gray-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-bold text-2xl text-black">
                          ₹{Number(finalPrice).toFixed(2)}
                        </p>
                        {Number(product.discount) > 0 && (
                          <p className="text-gray-400 line-through text-sm">
                            ₹{Number(product.price).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          removeFromWishlist(product.id)
                        }}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors group/btn"
                        title="Remove from wishlist"
                      >
                        <Trash2 size={20} className="group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>

                    <div className="flex gap-3">
                      <Link
                        href={`/products/${product.slug}`}
                        className="flex-1 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors text-center flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                      >
                        <span>View Product</span>
                        <ArrowRight size={18} />
                      </Link>
                      <button
                        disabled={!hasStock}
                        className="px-4 py-3 bg-gray-100 text-black rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Add to cart"
                      >
                        <ShoppingCart size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 md:py-24 bg-gray-50 rounded-2xl">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Your wishlist is empty</h2>
              <p className="text-gray-600 mb-8">
                Start adding items you love to your wishlist
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
              >
                <span>Browse Products</span>
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

