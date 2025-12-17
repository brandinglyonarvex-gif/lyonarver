"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  AlertCircle,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: { name: string };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setError(null);
      const response = await fetch("/api/admin/products?limit=100");
      if (response.ok) {
        const data = await response.json();
        // Handle both old array format and new paginated format
        setProducts(Array.isArray(data) ? data : data.products || []);
      } else {
        setError("Failed to load products. Please try again.");
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setError("An error occurred while loading products.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(`/api/admin/products/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setProducts(products.filter((p) => p.id !== id));
          alert("Product deleted successfully");
        } else {
          const data = await response.json();
          if (data.hasOrders) {
            alert(
              data.error ||
                "Cannot delete product with existing orders. Consider marking it as out of stock instead.",
            );
          } else {
            alert(data.error || "Failed to delete product");
          }
        }
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("An error occurred while deleting the product");
      }
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <div className="h-10 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-64 mt-2 animate-pulse"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
        </div>

        <div className="mb-6">
          <div className="h-12 bg-gray-200 rounded-lg w-full animate-pulse"></div>
        </div>

        <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  {[...Array(5)].map((_, index) => (
                    <th key={index} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded-lg w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md:hidden space-y-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="h-6 bg-gray-200 rounded-lg w-40 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div>
                  <div className="h-4 bg-gray-200 rounded-lg w-16 mb-2 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded-lg w-12 mb-2 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
            Products
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            A list of all the products in your store.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-black text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          <span>Create Product</span>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50/50 border border-red-200/50 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-pulse">
          <AlertCircle size={20} className="text-red-500" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Search */}
      <div className="mb-6 relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by product name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-black transition-colors duration-300 text-sm md:text-base"
        />
      </div>

      {/* Products Table - Desktop */}
      <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {product.category?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    ₹{Number(product.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        product.stock > 10
                          ? "bg-green-100 text-green-800"
                          : product.stock > 0
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Products Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1 truncate text-gray-800">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {product.category?.name || "N/A"}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </Link>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200/80">
              <div>
                <p className="text-xs text-gray-500 mb-1">Price</p>
                <p className="font-bold text-lg text-gray-800">
                  ₹{Number(product.price).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Stock</p>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    product.stock > 10
                      ? "bg-green-100 text-green-800"
                      : product.stock > 0
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12 md:py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="text-gray-400" size={32} />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">
              No products found
            </h2>
            <p className="text-gray-500 mb-6">
              {search
                ? `Your search for "${search}" did not match any products.`
                : "Get started by creating your first product."}
            </p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              <span>Create Product</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
