"use client";

import { useEffect, useState } from "react";
import { Eye, Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  productName: string;
  productImage: string | null;
  product?: {
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
  user: { name: string; email: string };
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
}

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onStatusUpdate: (orderId: string, newStatus: string) => Promise<void>;
}

function OrderDetailsModal({
  order,
  onClose,
  onStatusUpdate,
}: OrderDetailsModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(
    order?.status || "pending",
  );
  const [updating, setUpdating] = useState(false);

  if (!order) return null;

  const statuses = [
    {
      value: "pending",
      label: "Pending",
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      value: "confirmed",
      label: "Confirmed",
      icon: CheckCircle,
      color: "text-blue-600",
    },
    {
      value: "processing",
      label: "Processing",
      icon: Package,
      color: "text-purple-600",
    },
    {
      value: "shipped",
      label: "Shipped",
      icon: Truck,
      color: "text-indigo-600",
    },
    {
      value: "delivered",
      label: "Delivered",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      icon: XCircle,
      color: "text-red-600",
    },
  ];

  const handleUpdateStatus = async () => {
    if (selectedStatus === order.status) {
      onClose();
      return;
    }

    setUpdating(true);
    await onStatusUpdate(order.id, selectedStatus);
    setUpdating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold">Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Order Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Order Number</p>
                <p className="font-medium">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-gray-600">Date</p>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Customer</p>
                <p className="font-medium">{order.user.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium">{order.user.email}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Amount</p>
                <p className="font-bold text-lg">₹{Number(order.total).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Items</p>
                <p className="font-medium">{order.items.length} item(s)</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Shipping Address</h3>
              <div className="bg-gray-50 rounded-lg p-4 text-sm border border-gray-200">
                <p className="font-medium text-base mb-2">
                  {order.shippingAddress.fullName}
                </p>
                <p className="text-gray-700">{order.shippingAddress.phone}</p>
                <p className="text-gray-700 mt-2">
                  {order.shippingAddress.street}
                </p>
                <p className="text-gray-700">
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.postalCode}
                </p>
                <p className="text-gray-700">{order.shippingAddress.country}</p>
              </div>
            </div>
          )}

          {/* Items Purchased */}
          {order.items.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Items Purchased</h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 border border-gray-100 rounded-lg p-3"
                  >
                    <div className="w-16 h-16 rounded-lg bg-gray-50 overflow-hidden">
                      {(item.product?.images?.[0] || item.productImage) ? (
                        <img
                          src={item.product?.images?.[0] || item.productImage || ""}
                          alt={item.product?.name || item.productName || "Product"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.product?.name || item.productName || "Product removed"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ₹{(Number(item.price) * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        ₹{Number(item.price).toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Update */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Update Order Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {statuses.map((status) => {
                const StatusIcon = status.icon;
                return (
                  <button
                    key={status.value}
                    onClick={() => setSelectedStatus(status.value)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      selectedStatus === status.value
                        ? "border-black bg-gray-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <StatusIcon size={20} className={status.color} />
                    <span className="font-medium text-sm">{status.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50/50 border-t border-gray-200 flex gap-4 sticky bottom-0">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateStatus}
            disabled={updating}
            className="w-full px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {updating ? "Updating..." : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders?limit=100");
      if (response.ok) {
        const data = await response.json();
        // Handle both old array format and new paginated format
        setOrders(Array.isArray(data) ? data : data.orders || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(
          orders.map((order) => (order.id === orderId ? updatedOrder : order)),
        );
      }
    } catch (error) {
      console.error("Failed to update order:", error);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="h-10 bg-gray-200 rounded-lg w-48 mb-8 animate-pulse"></div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[...Array(7)].map((_, index) => (
                  <th key={index} className="px-6 py-3">
                    <div className="h-4 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="px-6 py-4">
                    <div className="h-6 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-8 bg-gray-200 rounded-lg w-28 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-8 bg-gray-200 rounded-lg w-28 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
            Orders
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            View and manage all customer orders.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                Total
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                Payment
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-4 font-mono text-sm text-gray-700">
                  {order.orderNumber}
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {order.user?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.user?.email}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-800">
                  ₹{Number(order.total).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      order.status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : order.status === "shipped"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "processing"
                        ? "bg-purple-100 text-purple-800"
                        : order.status === "confirmed"
                        ? "bg-indigo-100 text-indigo-800"
                        : order.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      order.paymentStatus === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.paymentStatus.charAt(0).toUpperCase() +
                      order.paymentStatus.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12 md:py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="text-gray-400" size={32} />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">
              No orders found
            </h2>
            <p className="text-gray-500">
              When a customer places an order, it will appear here.
            </p>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
