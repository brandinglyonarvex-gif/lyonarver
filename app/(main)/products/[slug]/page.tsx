"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  Star,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  X,
  ZoomIn,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useCartStore } from "@/lib/cart-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount: number;
  rating: number;
  reviewCount: number;
  images: string[];
  category: string;
  stock: number;
  sizes: Array<{ id: string; size: string; quantity: number }>;
}

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; image: string | null } | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useKindeBrowserClient();
  const { addItem } = useCartStore();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Product not found.");
        } else {
          throw new Error("Failed to fetch product.");
        }
      } else {
        const data = await response.json();
        setProduct(data);
        if (data.sizes && data.sizes.length > 0 && !selectedSize) {
          setSelectedSize(data.sizes[0].size);
        }
        if (data.reviews) {
          setReviews(data.reviews);
        }
      }
    } catch (err) {
      console.error("Failed to fetch product:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      toast({
        title: "Error",
        description: "Failed to load product details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [slug, selectedSize, toast]);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug, fetchProduct]);

  const checkWishlistStatus = useCallback(async () => {
    if (!isAuthenticated || !user || !product) return;
    try {
      const response = await fetch("/api/wishlist");
      if (response.ok) {
        const wishlist = await response.json();
        const inWishlist = wishlist.some(
          (item: any) => item.productId === product.id,
        );
        setIsWishlisted(inWishlist);
      }
    } catch (err) {
      console.error("Failed to check wishlist status:", err);
    }
  }, [isAuthenticated, user, product]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user && product) {
      checkWishlistStatus();
    } else if (!isAuthenticated) {
      setIsWishlisted(false);
    }
  }, [user, isAuthenticated, product, isAuthLoading, checkWishlistStatus]);

  const toggleWishlist = async () => {
    if (isAuthLoading || !product) return;

    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add items to your wishlist.",
      });
      router.push(`/api/auth/login?post_login_redirect_url=/products/${slug}`);
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        const response = await fetch(`/api/wishlist/${product.id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to remove from wishlist.");
        setIsWishlisted(false);
        toast({
          title: "Removed from Wishlist",
          description: `${product.name} has been removed from your wishlist.`,
        });
      } else {
        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        });
        if (!response.ok) throw new Error("Failed to add to wishlist.");
        setIsWishlisted(true);
        toast({
          title: "Added to Wishlist",
          description: `${product.name} has been added to your wishlist.`,
        });
      }
    } catch (err) {
      console.error("Failed to update wishlist:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update wishlist.",
        variant: "destructive",
      });
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !zoomActive) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handleAddToCart = () => {
    if (!product) return;

    const currentSelectedSize = product.sizes.find(s => s.size === selectedSize);
    const availableStock = currentSelectedSize?.quantity ?? product.stock;

    if (availableStock <= 0) {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock.",
        variant: "destructive",
      });
      return;
    }
    
    const cartItemId = `${product.id}-${selectedSize || 'default'}`;
    const existingItemInCart = useCartStore.getState().items.find(
      (item: any) => `${item.id}-${item.size || 'default'}` === cartItemId
    );

    const currentCartQuantity = existingItemInCart ? existingItemInCart.quantity : 0;
    const maxCanAdd = availableStock - currentCartQuantity;

    if (maxCanAdd <= 0) {
      toast({
        title: "Maximum Stock Reached",
        description: `You already have ${currentCartQuantity} of this item in your cart, and only ${availableStock} are available.`,
        variant: "destructive",
      });
      return;
    }

    const quantityToAdd = Math.min(quantity, maxCanAdd);

    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      discount: Number(product.discount),
      quantity: quantityToAdd,
      image: product.images?.[0] || "",
      maxStock: availableStock,
      size: selectedSize,
      sizeId: currentSelectedSize?.id,
    });

    toast({
      title: "Added to Cart",
      description: `${quantityToAdd} x ${product.name} added to your cart.`,
    });
    setQuantity(1);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAuthLoading) return;

    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a review.",
      });
      router.push(`/api/auth/login?post_login_redirect_url=/products/${slug}`);
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await fetch(`/api/products/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit review.");
      }

      const newReview = await response.json();
      setReviews([newReview, ...reviews]);
      setReviewForm({ rating: 5, title: "", comment: "" });
      setShowReviewForm(false);
      fetchProduct();
      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback.",
      });
    } catch (err) {
      console.error("Failed to submit review:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to submit review.",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
        <p className="text-gray-600 mb-6">The product you are looking for does not exist or is unavailable.</p>
        <Button asChild>
          <Link href="/products">
            <ChevronLeft size={16} className="mr-2" />
            Back to Products
          </Link>
        </Button>
      </div>
    );
  }

  const finalPrice = Number(product.price) * (1 - Number(product.discount) / 100);
  const selectedSizeData = product.sizes?.find(
    (s) => s.size === selectedSize,
  );
  const availableStock = selectedSizeData ? selectedSizeData.quantity : product.stock;

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 md:px-8 py-12 max-w-7xl">
        <Link
          href="/products"
          className="flex items-center gap-2 text-xs tracking-wide text-gray-500 hover:text-black mb-8 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16">
          <div>
            <div
              ref={imageRef}
              className="aspect-square bg-gray-50 mb-4 overflow-hidden relative cursor-zoom-in group"
              onMouseEnter={() => setZoomActive(true)}
              onMouseLeave={() => setZoomActive(false)}
              onMouseMove={handleImageMouseMove}
            >
              {product.images && product.images[selectedImage] ? (
                <>
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      zoomActive ? "scale-150" : "scale-100"
                    }`}
                    style={{
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    }}
                  />
                  {zoomActive && (
                    <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-2 pointer-events-none">
                      <ZoomIn size={14} />
                      <span>Zoom</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  No Image
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 border transition-colors ${
                      selectedImage === index
                        ? "border-black"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs tracking-widest uppercase text-gray-500 mb-4 font-light">
              {product.category}
            </p>

            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-black mb-6">
              {product.name}
            </h1>

            {product.rating > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i < Math.floor(product.rating)
                            ? "fill-black text-black"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-sm font-light">
                    {product.rating.toFixed(1)}
                  </span>
                </div>
                {product.reviewCount > 0 && (
                  <p className="text-sm text-gray-500 font-light">
                    ({product.reviewCount} reviews)
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl md:text-4xl font-light text-black">
                ₹{finalPrice.toFixed(2)}
              </span>
              {product.discount > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    ₹{Number(product.price).toFixed(2)}
                  </span>
                  <span className="text-xs tracking-widest uppercase text-black border border-black px-3 py-1 font-light">
                    Save {Number(product.discount).toFixed(0)}%
                  </span>
                </>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-gray-600 mb-8 font-light leading-relaxed">
                {product.description}
              </p>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <label className="block text-xs tracking-widest uppercase text-black mb-3 font-light">
                  Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size: any) => (
                    <Button
                      key={size.id}
                      variant={selectedSize === size.size ? "default" : "outline"}
                      onClick={() => setSelectedSize(size.size)}
                      disabled={size.quantity === 0}
                      className={`px-4 py-2 text-sm tracking-wide ${size.quantity === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {size.size} {size.quantity === 0 && "(Out of Stock)"}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              {availableStock > 0 ? (
                <p className="text-sm text-black font-light">
                  In Stock ({availableStock} available)
                </p>
              ) : (
                <p className="text-sm text-gray-500 font-light">Out of Stock</p>
              )}
            </div>

            <div className="flex gap-4 mb-8">
              <div className="flex items-center border border-gray-300">
                <Button
                  variant="ghost"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors font-light"
                >
                  -
                </Button>
                <span className="px-6 py-3 border-l border-r border-gray-300 text-sm">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setQuantity(Math.min(availableStock, quantity + 1))
                  }
                  disabled={quantity >= availableStock}
                  className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors font-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </Button>
              </div>
              <Button
                onClick={handleAddToCart}
                disabled={availableStock === 0}
                className="flex-1 py-3 text-sm tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </Button>
              <Button
                variant="outline"
                onClick={toggleWishlist}
                disabled={wishlistLoading}
              >
                {wishlistLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart
                    size={20}
                    className={
                      isWishlisted ? "fill-black text-black" : "text-gray-600"
                    }
                  />
                )}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-gray-200">
              <div className="text-center">
                <Truck className="w-5 h-5 mx-auto mb-2 text-gray-600" />
                <p className="text-xs tracking-wide font-light">
                  Free Shipping
                </p>
              </div>
              <div className="text-center">
                <Shield className="w-5 h-5 mx-auto mb-2 text-gray-600" />
                <p className="text-xs tracking-wide font-light">
                  Secure Payment
                </p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-5 h-5 mx-auto mb-2 text-gray-600" />
                <p className="text-xs tracking-wide font-light">
                  30-Day Returns
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-16 border-t border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-light tracking-tight text-black mb-2">
                Customer Reviews
              </h2>
              <p className="text-sm text-gray-500 font-light">
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </p>
            </div>
            {isAuthenticated && !showReviewForm && (
              <Button
                onClick={() => setShowReviewForm(true)}
                className="py-3 text-sm tracking-widest uppercase font-light"
              >
                Write a Review
              </Button>
            )}
          </div>

          {showReviewForm && (
            <div className="mb-12 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-light text-black">
                  Write a Review for {product.name}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewForm({ rating: 5, title: "", comment: "" });
                  }}
                  className="text-gray-400 hover:text-black"
                >
                  <X size={20} />
                </Button>
              </div>
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div>
                  <Label className="block text-xs tracking-widest uppercase text-black mb-3 font-light">
                    Rating
                  </Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        type="button"
                        variant="ghost"
                        onClick={() => setReviewForm({ ...reviewForm, rating })}
                        className="p-0 h-auto"
                      >
                        <Star
                          size={24}
                          className={
                            rating <= reviewForm.rating
                              ? "fill-black text-black"
                              : "text-gray-300"
                          }
                        />
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="block text-xs tracking-widest uppercase text-black mb-3 font-light">
                    Title
                  </Label>
                  <Input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, title: e.target.value })
                    }
                    placeholder="Review title"
                    className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <Label className="block text-xs tracking-widest uppercase text-black mb-3 font-light">
                    Comment
                  </Label>
                  <Textarea
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, comment: e.target.value })
                    }
                    placeholder="Share your thoughts..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm resize-none"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={submittingReview}
                    className="py-3 text-sm tracking-widest uppercase font-light"
                  >
                    {submittingReview ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Review"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewForm({ rating: 5, title: "", comment: "" });
                    }}
                    className="py-3 text-sm tracking-widest uppercase font-light"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {reviews.length > 0 ? (
            <div className="space-y-8">
              {reviews.map((review: Review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-100 pb-8 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      {review.user?.image ? (
                        <img
                          src={review.user.image}
                          alt={review.user.name || review.user.email || "User"}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 text-sm font-light">
                          {(review.user?.name ||
                            review.user?.email ||
                            "U")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-light text-black">
                            {review.user?.name ||
                              review.user?.email ||
                              "Anonymous"}
                          </p>
                          <p className="text-xs text-gray-500 font-light">
                            {new Date(review.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </p>
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={
                                i < review.rating
                                  ? "fill-black text-black"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <h4 className="text-sm font-light text-black mb-2">
                        {review.title}
                      </h4>
                      <p className="text-sm text-gray-600 font-light leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500 font-light mb-4">
                No reviews yet.
              </p>
              {isAuthenticated && !showReviewForm && (
                <Button
                  onClick={() => setShowReviewForm(true)}
                  variant="link"
                  className="text-sm tracking-widest uppercase font-light px-0"
                >
                  Be the first to review
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}