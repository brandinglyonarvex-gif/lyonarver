"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { ChevronLeft, Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

// ... (Interface and config definitions remain the same) ...
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
  subtotal: number;
  tax: number;
  shipping: number;
  createdAt: string;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
}

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-800", iconColor: "text-yellow-600" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "bg-blue-100 text-blue-800", iconColor: "text-blue-600" },
  processing: { label: "Processing", icon: Package, color: "bg-purple-100 text-purple-800", iconColor: "text-purple-600" },
  shipped: { label: "Shipped", icon: Truck, color: "bg-indigo-100 text-indigo-800", iconColor: "text-indigo-600" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "bg-green-100 text-green-800", iconColor: "text-green-600" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-red-100 text-red-800", iconColor: "text-red-600" },
};


export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/api/auth/login?post_login_redirect_url=/account/orders");
      return;
    }
    if (!authLoading && user) {
      const fetchOrders = async () => {
        try {
          const response = await fetch("/api/orders");
          if (!response.ok) throw new Error("Failed to fetch orders.");
          const data = await response.json();
          setOrders(data);
        } catch (error) {
          console.error("Failed to fetch orders:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
         <div className="flex flex-col items-center gap-3 text-gray-600">
          <Spinner />
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <Button asChild variant="ghost" className="mb-8">
          <Link href="/account">
            <ChevronLeft size={16} className="mr-2" />
            Back to Account
          </Link>
        </Button>

        <h1 className="text-2xl sm:text-3xl font-bold mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold mb-2">No orders found</h2>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet. Let's change that!</p>
            <Button asChild>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = config.icon;

              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-200">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 uppercase text-xs tracking-wider">Order #</p>
                        <p className="font-semibold text-gray-800">{order.orderNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 uppercase text-xs tracking-wider">Date</p>
                        <p className="font-medium text-gray-800">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                       <div className="col-span-2 sm:col-span-1">
                        <p className="text-gray-500 uppercase text-xs tracking-wider">Total</p>
                        <p className="font-bold text-base text-gray-900">₹{Number(order.total).toFixed(2)}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-gray-500 uppercase text-xs tracking-wider mb-1">Status</p>
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                          <StatusIcon size={14} />
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Order Items */}
                        <div className="space-y-4">
                             <h3 className="font-semibold text-gray-800">Items ({order.items.length})</h3>
                            {order.items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                <img
                                    src={item.product?.images?.[0] || item.productImage || "/placeholder.svg"}
                                    alt={item.product?.name || item.productName || "Product"}
                                    className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                                />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm mb-1">{item.product?.name || item.productName || "Product"}</h4>
                                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                </div>
                                <div className="text-right text-sm">
                                    <p className="font-semibold">₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
                                    <p className="text-gray-500">({`₹${Number(item.price).toFixed(2)} each`})</p>
                                </div>
                                </div>
                            ))}
                        </div>

                         {/* Shipping & Summary */}
                        <div className="space-y-6">
                            {order.shippingAddress && (
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">Shipping To</h3>
                                    <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                                    <p className="font-medium text-gray-800">{order.shippingAddress.fullName}</p>
                                    <p>{order.shippingAddress.street}</p>
                                    <p>
                                        {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                                        {order.shippingAddress.postalCode}
                                    </p>
                                    </div>
                                </div>
                            )}
                             <div>
                                <h3 className="font-semibold text-gray-800 mb-2">Summary</h3>
                                <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>₹{Number(order.subtotal).toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Tax</span><span>₹{Number(order.tax).toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span>{Number(order.shipping) === 0 ? "FREE" : `₹${Number(order.shipping).toFixed(2)}`}</span></div>
                                    <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-300"><span className="text-gray-900">Total</span><span className="text-gray-900">₹{Number(order.total).toFixed(2)}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}