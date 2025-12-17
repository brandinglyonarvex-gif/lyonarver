"use client";

import { useEffect, useState } from "react";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertCircle,
  Loader2,
  Image,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          setError("Failed to load dashboard statistics");
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setError("An error occurred while loading statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="mb-6 md:mb-8">
          <div className="h-10 bg-gray-200 rounded-lg w-1/3 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-1/2 mt-2 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded-lg w-1/2 mb-2 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded-lg w-1/3 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200">
          <div className="h-8 bg-gray-200 rounded-lg w-1/4 mb-6 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="p-6 border-2 border-gray-200 rounded-2xl text-center"
              >
                <div className="w-16 h-16 bg-gray-200 rounded-xl mx-auto mb-4 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded-lg w-2/3 mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      href: "/admin/products",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      href: "/admin/orders",
    },
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      href: "/admin/users",
    },
    {
      label: "Total Revenue",
      value: `₹${Number(stats.totalRevenue).toFixed(2)}`,
      icon: TrendingUp,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      href: "/admin/orders",
    },
  ];

  const quickActions = [
    {
      label: "Add Product",
      icon: Package,
      href: "/admin/products/new",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      hoverColor: "hover:bg-blue-100",
    },
    {
      label: "View Products",
      icon: Package,
      href: "/admin/products",
      color: "text-green-500",
      bgColor: "bg-green-50",
      hoverColor: "hover:bg-green-100",
    },
    {
      label: "View Orders",
      icon: ShoppingCart,
      href: "/admin/orders",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      hoverColor: "hover:bg-purple-100",
    },
    {
      label: "View Users",
      icon: Users,
      href: "/admin/users",
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      hoverColor: "hover:bg-orange-100",
    },
    {
      label: "Cover Photos",
      icon: Image,
      href: "/admin/cover-photos",
      color: "text-pink-500",
      bgColor: "bg-pink-50",
      hoverColor: "hover:bg-pink-100",
    },
  ];

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
          Welcome back! Here's an overview of your store.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50/50 border border-red-200/50 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-pulse">
          <AlertCircle size={20} className="text-red-500" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const isRevenueCard = card.label === "Total Revenue";
          return (
            <Link
              key={index}
              href={card.href}
              className={`group rounded-2xl p-6 transition-all duration-300 ${
                isRevenueCard
                  ? "bg-gradient-to-br from-black to-gray-800 text-white shadow-2xl"
                  : "bg-white shadow-lg border border-gray-200 hover:shadow-xl"
              } hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                    isRevenueCard
                      ? "bg-white/20"
                      : `bg-gradient-to-br ${card.color}`
                  }`}
                >
                  <Icon
                    className={isRevenueCard ? "text-white" : "text-white"}
                    size={24}
                  />
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isRevenueCard
                      ? "bg-white/20"
                      : `${card.bgColor} ${card.textColor}`
                  }`}
                >
                  View
                </div>
              </div>
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    isRevenueCard ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {card.label}
                </p>
                <p
                  className={`text-3xl md:text-4xl font-bold ${
                    isRevenueCard ? "text-white" : "text-black"
                  }`}
                >
                  {card.value}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200">
        <h2 className="text-xl md:text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                href={action.href}
                className="group p-6 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center border-2 border-transparent hover:border-gray-200"
              >
                <div
                  className={`p-4 rounded-xl w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 ${action.bgColor} ${action.color}`}
                >
                  <Icon className="w-8 h-8 mx-auto" />
                </div>
                <p className="font-semibold text-gray-800">{action.label}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
