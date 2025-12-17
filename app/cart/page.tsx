"use client";

import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getTotal } = useCartStore();
  const { user } = useAuth();
  const router = useRouter();
  const subtotal = getSubtotal();
  const tax = subtotal * 0.1;
  const shipping = subtotal > 50 ? 0 : 10; // Updated to match server logic
  const total = getTotal();

  const handleCheckout = () => {
    if (!user) {
      router.push("/api/auth/login?post_login_redirect_url=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-6" />
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Button asChild size="lg">
            <Link href="/products">
              Start Shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
              {items.map((item) => {
                const finalPrice = item.price * (1 - item.discount / 100);
                return (
                  <div
                    key={`${item.id}-${(item as any).size}`}
                    className="flex flex-col sm:flex-row gap-4 border-b border-gray-200 pb-4 last:border-b-0"
                  >
                    {/* Image */}
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <Link
                          href={`/products/${item.id}`} // Assuming item.id is the slug, if not, adjust
                          className="font-semibold hover:text-gray-700 mb-1 block"
                        >
                          {item.name}
                        </Link>
                         {(item as any).size && (
                            <p className="text-sm text-gray-500">Size: {(item as any).size}</p>
                        )}
                        <p className="text-lg font-bold mt-1">
                          ₹{finalPrice.toFixed(2)}
                          {item.discount > 0 && (
                            <span className="ml-2 text-sm text-gray-500 line-through">
                              ₹{item.price.toFixed(2)}
                            </span>
                          )}
                        </p>
                      </div>
                       <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(`${item.id}-${(item as any).size}`, item.quantity - 1)}
                          className="h-8 w-8"
                        >
                          <Minus size={14} />
                        </Button>
                        <span className="px-3 py-1 bg-white border border-gray-300 rounded text-sm min-w-[40px] text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(`${item.id}-${(item as any).size}`, item.quantity + 1)}
                           disabled={item.quantity >= (item.maxStock ?? Infinity)}
                          className="h-8 w-8"
                        >
                          <Plus size={14} />
                        </Button>
                      </div>
                    </div>

                    {/* Total & Remove for Desktop */}
                    <div className="hidden sm:flex flex-col justify-between items-end">
                       <div>
                        <p className="text-lg font-bold">
                          ₹{(finalPrice * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => removeItem(`${item.id}-${(item as any).size}`)}
                        className="text-gray-500 hover:text-red-600 font-medium"
                      >
                        <Trash2 size={16} className="mr-1" />
                        Remove
                      </Button>
                    </div>

                    {/* Mobile Footer for Item */}
                    <div className="sm:hidden flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                        <p className="font-semibold">
                          Item Total: ₹{(finalPrice * item.quantity).toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(`${item.id}-${(item as any).size}`)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6 border-b pb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax (10%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-green-600 font-semibold" : ""}>
                    {shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleCheckout}
                  className="w-full"
                  size="lg"
                >
                  Proceed to Checkout
                  <ArrowRight size={20} className="ml-2" />
                </Button>

                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link href="/products">
                    Continue Shopping
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}