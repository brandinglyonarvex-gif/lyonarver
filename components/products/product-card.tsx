"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { useState, useEffect } from "react"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"

interface ProductSize {
  id: string
  size: string
  quantity: number
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  discount: number
  rating: number
  images: string[]
  stock: number
  sizes?: ProductSize[]
}

export default function ProductCard({ product }: { product: Product }) {
  const { user, isAuthenticated, isLoading } = useKindeBrowserClient()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [imageError, setImageError] = useState(false)
  const finalPrice = product.price * (1 - product.discount / 100)

  useEffect(() => {
    if (isLoading) return
    if (user && isAuthenticated) {
      checkWishlistStatus()
    } else {
      setIsWishlisted(false)
    }
  }, [user, isAuthenticated, isLoading])

  const checkWishlistStatus = async () => {
    try {
      const response = await fetch("/api/wishlist")
      if (response.ok) {
        const wishlist = await response.json()
        const inWishlist = wishlist.some((item: any) => item.product.id === product.id)
        setIsWishlisted(inWishlist)
      }
    } catch (error) {
      // Silent fail
    }
  }

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLoading) {
      return
    }

    if (!user || !isAuthenticated) {
      window.location.href = "/api/auth/login?post_login_redirect_url=" + window.location.pathname
      return
    }

    try {
      if (isWishlisted) {
        await fetch(`/api/wishlist/${product.id}`, { method: "DELETE" })
        setIsWishlisted(false)
      } else {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        })
        setIsWishlisted(true)
      }
    } catch (error) {
      console.error("Failed to update wishlist:", error)
    }
  }

  return (
    <div className="group">
      <Link href={`/products/${product.slug}`}>
        {/* Image Container */}
        <div className="relative aspect-square bg-gray-50 mb-4 overflow-hidden">
          {!imageError ? (
            <img
              src={product.images[0] || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-500"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
              No Image
            </div>
          )}
          
          {/* Discount Badge - Minimal */}
          {product.discount > 0 && (
            <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-xs tracking-wide font-light">
              -{product.discount}%
            </div>
          )}
          
          {/* Wishlist Button - Minimal */}
          <button
            onClick={toggleWishlist}
            className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300"
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart 
              size={16} 
              className={`transition-all duration-300 ${
                isWishlisted 
                  ? "fill-black text-black" 
                  : "text-black/60 group-hover:text-black"
              }`} 
            />
          </button>
        </div>

        {/* Content - Minimal */}
        <div className="space-y-2">
          <h3 className="text-sm font-light text-black tracking-wide">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-black font-light">
              ₹{finalPrice.toFixed(2)}
              {product.discount > 0 && (
                <span className="ml-2 text-gray-400 line-through text-xs">
                  ₹{product.price.toFixed(2)}
                </span>
              )}
            </p>
            {product.stock === 0 && (
              <span className="text-xs text-gray-400 tracking-wide uppercase">Sold Out</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
