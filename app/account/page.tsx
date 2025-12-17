"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";
import {
  CalendarDays,
  CheckCircle,
  Heart,
  LogOut,
  Package,
  ShoppingBag,
  Truck,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKindeUser } from "@/hooks/use-kinde-user";
import { Spinner } from "@/components/ui/spinner";

// ... (Interface definitions remain the same) ...
interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  productName: string;
  productImage: string | null;
  product: {
    id: string;
    name: string;
    images: string[];
  } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discount: number;
    images: string[];
  };
}

const statusStyles: Record<string, { label: string; badge: string; icon: ComponentType<any> }> = {
  pending: { label: "Pending", badge: "bg-amber-100 text-amber-800", icon: Package },
  confirmed: { label: "Confirmed", badge: "bg-blue-100 text-blue-800", icon: CheckCircle },
  processing: { label: "Processing", badge: "bg-purple-100 text-purple-800", icon: Package },
  shipped: { label: "Shipped", badge: "bg-indigo-100 text-indigo-800", icon: Truck },
  delivered: { label: "Delivered", badge: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
  cancelled: { label: "Cancelled", badge: "bg-rose-100 text-rose-800", icon: Package },
};

export default function AccountPage() {
  const { isSignedIn, user, loading, error } = useKindeUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ... (useEffect for data fetching remains the same) ...
   useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (loading || !isSignedIn || !user) {
        if (!loading) {
          setOrders([]);
          setWishlist([]);
        }
        setOrdersLoading(false);
        setWishlistLoading(false);
        return;
      }

      try {
        setOrdersLoading(true);
        setWishlistLoading(true);
        const [ordersResponse, wishlistResponse] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/wishlist"),
        ]);

        if (!ordersResponse.ok) throw new Error("Unable to load orders");
        if (!wishlistResponse.ok) throw new Error("Unable to load wishlist");

        const [ordersData, wishlistData] = await Promise.all([
          ordersResponse.json(),
          wishlistResponse.json(),
        ]);

        if (!cancelled) {
          setOrders(ordersData);
          setWishlist(wishlistData);
          setFetchError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) {
          setOrdersLoading(false);
          setWishlistLoading(false);
        }
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user, loading]);


  const stats = useMemo(() => {
    const openOrders = orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length;
    const deliveredOrders = orders.filter((order) => order.status === "delivered").length;
    const wishlistCount = wishlist.length;

    return { openOrders, deliveredOrders, wishlistCount };
  }, [orders, wishlist]);

  const initials = useMemo(() => {
    if (!user) return "U";
    if (user.name) {
      const fromName = user.name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .slice(0, 2)
        .join("");
      if (fromName) return fromName;
    }
    return user.email?.charAt(0)?.toUpperCase() ?? "U";
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <Spinner />
          <p>Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-3">Please sign in</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          Access your orders, wishlist, and saved details by signing in to your account.
        </p>
        <Button asChild size="lg">
          <Link href="/api/auth/login?post_login_redirect_url=/account">
            Sign In
          </Link>
        </Button>
        {error && <p className="text-sm text-rose-500 mt-4">{error}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="container mx-auto px-4 space-y-8">
        {/* User Welcome Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center text-center md:flex-row md:text-left md:justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-semibold text-gray-700 flex-shrink-0">
              {user.image ? (
                 <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover rounded-full"/>
              ) : (
                initials
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{user.name || "Customer"}</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <LogoutLink>
                <Button variant="outline">
                    <LogOut size={16} className="mr-2" />
                    Sign out
                </Button>
            </LogoutLink>
          </div>
        </div>

        {fetchError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl">
            {fetchError}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Open orders" value={stats.openOrders} helper="In progress or shipped" icon={<Truck className="text-indigo-600" size={20} />} loading={ordersLoading}/>
          <StatCard title="Delivered" value={stats.deliveredOrders} helper="Completed orders" icon={<CheckCircle className="text-emerald-600" size={20} />} loading={ordersLoading}/>
          <StatCard title="Wishlist" value={stats.wishlistCount} helper="Your saved items" icon={<Heart className="text-rose-500" size={20} />} loading={wishlistLoading}/>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <section className="bg-white rounded-2xl shadow-sm p-6 lg:col-span-2">
            <header className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold">Recent Orders</h2>
                <p className="text-sm text-gray-500">Here are your latest orders.</p>
              </div>
              {orders.length > 0 && (
                <Button asChild variant="link" className="px-0">
                  <Link href="/account/orders">View all</Link>
                </Button>
              )}
            </header>
            {ordersLoading ? (
              <div className="h-40 flex items-center justify-center text-gray-500"><Spinner/></div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
                <p className="text-lg font-semibold mb-2">No orders yet</p>
                <p className="text-gray-500 mb-4">Start shopping to track your orders here.</p>
                <Button asChild>
                  <Link href="/products">Browse products</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 3).map((order) => {
                  const style = statusStyles[order.status] || statusStyles.pending;
                  const StatusIcon = style.icon;
                  return (
                    <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
                          <p className="font-semibold text-lg">₹{Number(order.total).toFixed(2)}</p>
                           <p className="text-sm text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${style.badge}`}>
                          <StatusIcon size={16} />
                          {style.label}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
                        {order.items.slice(0, 3).map((item) => (
                           <div key={item.id} className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-full pr-3">
                              <img src={item.product?.images?.[0] || item.productImage || "/placeholder.svg"} alt={item.product?.name || item.productName || "Product"} className="w-6 h-6 rounded-full object-cover"/>
                              <span className="text-xs">{item.product?.name || item.productName || "Product"} × {item.quantity}</span>
                           </div>
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-gray-400 self-center text-xs">+{order.items.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-1">Quick Actions</h2>
              <p className="text-sm text-gray-500">Manage your account.</p>
            </div>
            <div className="space-y-4">
              <QuickAction icon={<ShoppingBag size={18} />} title="Order History" helper="Track packages & invoices" href="/account/orders"/>
              <QuickAction icon={<Heart size={18} />} title="Wishlist" helper="Your saved items" href="/wishlist"/>
              <QuickAction icon={<Package size={18} />} title="Shopping Cart" helper="View items and checkout" href="/cart" />
            </div>
          </section>
        </div>

        {/* Saved Items */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
           <header className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold">Saved Items</h2>
                <p className="text-sm text-gray-500">Items from your wishlist.</p>
              </div>
              {wishlist.length > 0 && (
                <Button asChild variant="link" className="px-0">
                  <Link href="/wishlist">Manage wishlist</Link>
                </Button>
              )}
            </header>
          {wishlistLoading ? (
            <div className="h-36 flex items-center justify-center text-gray-500"><Spinner/></div>
          ) : wishlist.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
              <p className="text-lg font-semibold mb-2">Nothing saved yet</p>
              <p className="text-gray-500 mb-4">Add items to your wishlist to see them here.</p>
              <Button asChild>
                <Link href="/products">Find products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {wishlist.slice(0, 3).map(({ id, product }) => {
                const finalPrice = product.price * (1 - product.discount / 100);
                return (
                  <Link
                    key={id}
                    href={`/products/${product.slug}`}
                    className="border border-gray-100 rounded-xl p-4 hover:border-black transition group"
                  >
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-50 mb-4">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                      )}
                    </div>
                    <p className="font-semibold mb-2 line-clamp-2 text-sm">{product.name}</p>
                    <div className="text-sm">
                      <span className="font-semibold text-black">₹{Number(finalPrice).toFixed(2)}</span>
                      {product.discount > 0 && (
                        <span className="text-gray-500 line-through ml-2">₹{Number(product.price).toFixed(2)}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ title, value, helper, icon, loading }: { title: string; value: number; helper: string; icon: ReactNode; loading?: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 capitalize">{title}</p>
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-3xl font-semibold">
        {loading ? <span className="text-gray-300">...</span> : value}
      </p>
      <p className="text-sm text-gray-500 mt-1">{helper}</p>
    </div>
  );
}

function QuickAction({ icon, title, helper, href }: { icon: ReactNode; title: string; helper: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 border border-gray-100 rounded-xl p-4 hover:border-black transition-all hover:bg-gray-50"
    >
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0">{icon}</div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-gray-500">{helper}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 ml-auto"/>
    </Link>
  );
}