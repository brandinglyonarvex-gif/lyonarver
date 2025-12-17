'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

export default function Home() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [coverPhotos, setCoverPhotos] = useState<any[]>([])
  const [loadingCoverPhotos, setLoadingCoverPhotos] = useState(true)
  const [currentCoverIndex, setCurrentCoverIndex] = useState(0)
  const [newsletterEmail, setNewsletterEmail] = useState("");

  // ... (useEffect hooks for fetching data remain the same) ...
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories/landing")
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        } else {
          throw new Error("Failed to fetch categories")
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch("/api/products/featured")
        if (response.ok) {
          const data = await response.json()
          setFeaturedProducts(data)
        } else {
          throw new Error("Failed to fetch featured products")
        }
      } catch (error) {
        console.error("Failed to fetch featured products:", error)
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchFeaturedProducts()
  }, [])

  useEffect(() => {
    const fetchCoverPhotos = async () => {
      try {
        const response = await fetch("/api/cover-photos")
        if (response.ok) {
          const data = await response.json()
          setCoverPhotos(data)
        } else {
          throw new Error("Failed to fetch cover photos")
        }
      } catch (error) {
        console.error("Failed to fetch cover photos:", error)
      } finally {
        setLoadingCoverPhotos(false)
      }
    }
    fetchCoverPhotos()
  }, [])

  useEffect(() => {
    if (coverPhotos.length > 1) {
      const interval = setInterval(() => {
        setCurrentCoverIndex((prev) => (prev + 1) % coverPhotos.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [coverPhotos.length])

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      // Logic to submit email to a service would go here
      toast({
        title: "Subscribed!",
        description: "Thanks for joining our newsletter.",
      });
      setNewsletterEmail("");
    } else {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-gray-100 overflow-hidden">
        {loadingCoverPhotos ? (
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        ) : coverPhotos.length > 0 ? (
          <>
            {coverPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  currentCoverIndex === index ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.title || "Background"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30"></div>
              </div>
            ))}
            <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
              {coverPhotos[currentCoverIndex]?.title && (
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-white mb-4">
                  {coverPhotos[currentCoverIndex].title}
                </h1>
              )}
              {coverPhotos[currentCoverIndex]?.subtitle && (
                <p className="text-base sm:text-lg md:text-xl text-white/90 font-light max-w-3xl mx-auto mb-8">
                  {coverPhotos[currentCoverIndex].subtitle}
                </p>
              )}
              <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-black transition-colors duration-300">
                <Link href={coverPhotos[currentCoverIndex]?.link || "/products"}>
                  Explore Collection <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {coverPhotos.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {coverPhotos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentCoverIndex(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentCoverIndex === index ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-black mb-4">
              LyonArvex
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 font-light max-w-3xl mx-auto mb-8">
              Timeless essentials crafted for the modern wardrobe.
            </p>
            <Button asChild size="lg">
              <Link href="/products">
                Explore Collection <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black">
              Featured Products
            </h2>
            <div className="w-20 h-px bg-black mx-auto mt-4"></div>
          </div>

          {loadingProducts ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group"
                >
                  <div className="aspect-square bg-gray-50 mb-4 overflow-hidden rounded-lg">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-light text-black line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-black font-semibold mt-1">
                      ₹{(Number(product.price) * (1 - Number(product.discount) / 100)).toFixed(2)}
                      {Number(product.discount) > 0 && (
                        <span className="ml-2 text-gray-400 line-through text-xs">
                          ₹{Number(product.price).toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No featured products available at the moment.</p>
            </div>
          )}

          {featuredProducts.length > 0 && (
            <div className="mt-12 text-center">
              <Button asChild variant="outline">
                <Link href="/products">
                  View All Products <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black">
                Shop by Collection
              </h2>
              <div className="w-20 h-px bg-black mx-auto mt-4"></div>
            </div>

            {loadingCategories ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.slug}`}
                    className="group relative aspect-[4/5] overflow-hidden rounded-lg"
                  >
                     <img
                        src={category.image || '/placeholder.svg'}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300"></div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <h3 className="text-lg font-semibold text-white tracking-wide uppercase">
                          {category.name}
                        </h3>
                        <p className="text-sm text-white/80 mt-1">
                          {category._count.products} {category._count.products === 1 ? 'Product' : 'Products'}
                        </p>
                      </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black mb-4">
              Join Our Newsletter
            </h2>
            <p className="text-sm text-gray-600 font-light max-w-md mx-auto mb-8">
              Subscribe to receive updates on new arrivals and exclusive offers.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 text-center sm:text-left"
                required
              />
              <Button type="submit" className="w-full sm:w-auto">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}