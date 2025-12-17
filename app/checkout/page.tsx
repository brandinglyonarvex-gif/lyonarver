"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import Script from "next/script";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { SHIPPING_THRESHOLD, SHIPPING_COST, TAX_RATE } from "@/lib/constants";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { items, getSubtotal, getTotal, clearCart } = useCartStore();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Set initial form data when user is loaded - using useEffect instead of useState
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const subtotal = getSubtotal();
  const tax = subtotal * TAX_RATE;
  const shipping = subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = getTotal();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCountryChange = (value: string) => {
    setFormData({
      ...formData,
      country: value,
    });
  };

  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic form validation
    const requiredFields = ["fullName", "email", "phone", "street", "city", "state", "postalCode", "country"];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast({
          title: "Missing Information",
          description: `Please fill in the '${field}' field.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Phone number validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast({
        title: "Invalid Phone Number",
        description:
          "Please enter a valid 10-digit Indian mobile number.",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Get Razorpay Key
      const keyResponse = await fetch("/api/payments/razorpay-key");
      if (!keyResponse.ok) throw new Error("Could not retrieve payment key.");
      const { key } = await keyResponse.json();

      // 2. Create Order on Backend
      // Extract original product ID from cart item ID (which may include size suffix)
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => {
            // Cart stores items with ID format: "productId" or "productId-sizeId"
            const parts = item.id.split("-");
            const productId = item.sizeId
              ? item.id.replace(`-${item.sizeId}`, "")
              : item.id;

            return {
              productId,
              quantity: item.quantity,
              sizeId: item.sizeId || null,
              sizeName: item.size || null,
            };
          }),
          shippingAddress: formData,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || "Failed to create payment order.");
      }
      const paymentData = await orderResponse.json();

      // 3. Open Razorpay Modal
      const options = {
        key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "LyonArvex",
        description: "E-Commerce Store Purchase",
        order_id: paymentData.orderId,
        handler: async (response: any) => {
          toast({
            title: "Payment Successful!",
            description: "Verifying your order, please wait...",
          });

          try {
            // 4. Verify Payment
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: paymentData.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error("Payment verification failed.");
            }

            const verifyData = await verifyResponse.json();

            // 5. Success - Clear cart and redirect
            toast({
              title: "Order Confirmed!",
              description: "Redirecting you to your order summary.",
            });
            clearCart();
            router.replace(
              `/order-confirmation?orderId=${verifyData.order.orderNumber}`,
            );

          } catch (err) {
            toast({
              title: "Verification Failed",
              description:
                "Your payment was successful but we couldn't confirm your order automatically. Please contact support with your Order ID.",
              variant: "destructive",
              duration: 10000,
            });
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast({
              title: "Payment Canceled",
              description: "Your order was not placed. Stock has been reserved - please complete checkout within 30 minutes.",
              variant: "destructive",
            });
            setIsProcessing(false);
          },
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#000000",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err) {
      toast({
        title: "An Error Occurred",
        description:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };


  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    router.replace(`/sign-in?post_login_redirect_url=/checkout`);
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
        <Button asChild>
          <Link href="/products">
            Continue Shopping
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/cart"
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-8"
          >
            <ChevronLeft size={16} />
            Back to Cart
          </Link>

          <h1 className="text-3xl font-bold mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Form */}
            <form onSubmit={processPayment} className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="street">Street Address</Label>
                <Input id="street" name="street" value={formData.street} onChange={handleInputChange} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" value={formData.state} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleInputChange} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="country">Country</Label>
                  <Select name="country" value={formData.country} onValueChange={handleCountryChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : `Pay ₹${total.toFixed(2)}`}
              </Button>
            </form>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                  {items.map((item) => {
                    const finalPrice = item.price * (1 - item.discount / 100);
                    return (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                           <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
                           <div>
                            <p className="text-gray-800 font-semibold">{item.name}</p>
                            <p className="text-gray-500 text-xs">
                              Qty: {item.quantity}
                              {item.size && ` • Size: ${item.size}`}
                            </p>
                           </div>
                        </div>
                        <span className="font-medium">
                          ₹{(finalPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? "text-green-600 font-semibold" : ""}>
                      {shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`}
                    </span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
