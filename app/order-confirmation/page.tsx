"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Package, MapPin, Clock, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { Order, OrderItem, Address, User } from "@prisma/client";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

// Define a more specific type for the fetched order data
type OrderDetails = Order & {
  items: OrderItem[];
  shippingAddress: Address;
  user: User;
};

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("No order ID found.");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error("Could not find your order details.");
        }
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <OrderConfirmationLoading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Error</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button asChild>
            <Link href="/account/orders">Go to My Orders</Link>
        </Button>
      </div>
    );
  }

  if (!order) {
    return null; // Should be handled by error state
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
              <h1 className="text-4xl font-bold mb-3">Order Confirmed!</h1>
              <p className="text-lg text-gray-600">
                Thank you, {order.shippingAddress.fullName.split(' ')[0]}! Your order is being processed.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Order ID: <strong>{order.orderNumber}</strong>
              </p>
            </div>

            {/* Order Summary Card */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <h2 className="text-2xl font-bold mb-6 border-b pb-4">Order Summary</h2>

                <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-3">Items Purchased</h3>
                    <div className="space-y-4">
                        {order.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <img src={item.productImage || '/placeholder.svg'} alt={item.productName} className="w-16 h-16 rounded-md object-cover bg-gray-100" />
                                    <div>
                                        <p className="font-semibold">{item.productName}</p>
                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                    </div>
                                </div>
                                <p className="font-semibold">₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    <div>
                        <h3 className="font-semibold text-lg mb-3">Shipping Address</h3>
                        <div className="text-gray-600 text-sm">
                            <p>{order.shippingAddress.fullName}</p>
                            <p>{order.shippingAddress.street}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}</p>
                            <p>{order.shippingAddress.country}</p>
                            <p>Phone: {order.shippingAddress.phone}</p>
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold text-lg mb-3">Payment Details</h3>
                        <div className="text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span>₹{Number(order.subtotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span>₹{Number(order.shipping).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax</span>
                                <span>₹{Number(order.tax).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                                <span>Total</span>
                                <span>₹{Number(order.total).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center text-xs text-gray-500 pt-6 border-t">
                    A confirmation email has been sent to {order.user.email}.
                </div>
            </div>

             {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                    <Link href="/account/orders">View All Orders</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                    <Link href="/products">Continue Shopping</Link>
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}

function OrderConfirmationLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Spinner />
        <p className="text-gray-600 text-sm mt-4">Loading your order details…</p>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<OrderConfirmationLoading />}>
      <OrderConfirmationContent />
    </Suspense>
  );
}