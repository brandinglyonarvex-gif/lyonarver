"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  showOnLanding: boolean;
  active: boolean;
  order: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    showOnLanding: false,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(
          data.sort((a: Category, b: Category) => a.order - b.order),
        );
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("folder", "categories");

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setFormData((prev) => ({ ...prev, image: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          order: editingId ? undefined : categories.length,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save category");
      }

      setFormData({
        name: "",
        description: "",
        image: "",
        showOnLanding: false,
      });
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description ?? "",
      image: category.image ?? "",
      showOnLanding: category.showOnLanding,
    });
    setEditingId(category.id);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? Products in this category (without orders) will also be deleted.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchCategories();
        alert("Category deleted successfully");
      } else {
        const data = await response.json();
        if (data.hasOrders) {
          alert(
            data.error ||
              "Cannot delete category. Some products in this category have existing orders.",
          );
        } else {
          alert(data.error || "Failed to delete category");
        }
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("An error occurred while deleting the category");
    }
  };

  const toggleShowOnLanding = async (id: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnLanding: !currentValue }),
      });

      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  const toggleActive = async (id: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentValue }),
      });

      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  const moveOrder = async (id: string, direction: "up" | "down") => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;

    const newOrder =
      direction === "up" ? category.order - 1 : category.order + 1;
    const otherCategory = categories.find((c) => c.order === newOrder);

    if (otherCategory) {
      // Swap orders
      await fetch(`/api/admin/categories/${otherCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: category.order }),
      });
      await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder }),
      });
      fetchCategories();
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", image: "", showOnLanding: false });
    setError("");
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-10 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-64 mt-2 animate-pulse"></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 border border-gray-200">
          <div className="h-8 bg-gray-200 rounded-lg w-1/4 mb-6 animate-pulse"></div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-12 bg-gray-200 rounded-lg w-full animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded-lg w-full animate-pulse"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded-lg w-full animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded-lg w-1/3 animate-pulse"></div>
            <div className="flex gap-4">
              <div className="h-12 bg-gray-200 rounded-lg w-full animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[...Array(6)].map((_, index) => (
                    <th key={index} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(3)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-gray-200 rounded-lg w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
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
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
            Categories
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Organize your products into categories.
          </p>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50/50 border border-red-200/50 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-pulse">
          <AlertCircle size={20} className="text-red-500" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Add/Edit Form */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 border border-gray-200">
        <h2 className="text-xl font-bold mb-6">
          {editingId ? "Edit Category" : "Add New Category"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. T-Shirts"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-black transition-colors duration-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="A short description"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-black transition-colors duration-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Category Image
            </label>
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                  id="category-image-upload"
                />
                <label
                  htmlFor="category-image-upload"
                  className="block w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-black transition-colors duration-300 text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Upload size={16} />
                    <span>
                      {uploading
                        ? "Uploading..."
                        : formData.image
                        ? "Change Image"
                        : "Upload Image"}
                    </span>
                  </div>
                </label>
              </div>
              {formData.image && (
                <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0">
                  <img
                    src={formData.image}
                    alt="Category"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showOnLanding"
              checked={formData.showOnLanding}
              onChange={(e) =>
                setFormData({ ...formData, showOnLanding: e.target.checked })
              }
              className="w-5 h-5 text-black border-2 border-gray-300 rounded focus:ring-black focus:ring-2"
            />
            <label
              htmlFor="showOnLanding"
              className="text-sm font-semibold text-gray-700 cursor-pointer"
            >
              Show on Landing Page
            </label>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={uploading || loading}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 disabled:opacity-50"
            >
              {editingId ? "Update Category" : "Add Category"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-full border-2 border-gray-300 text-black py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  Image
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  Featured
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  Order
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category) => (
                <tr
                  key={category.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {category.name}
                      </p>
                      {category.description && (
                        <p className="text-sm text-gray-500">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {category.image ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No image</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(category.id, category.active)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        category.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                      title={
                        category.active
                          ? "Click to hide from users"
                          : "Click to show to users"
                      }
                    >
                      {category.active ? "Visible" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        toggleShowOnLanding(category.id, category.showOnLanding)
                      }
                      className={`p-2 rounded-lg transition-colors ${
                        category.showOnLanding
                          ? "text-green-700 bg-green-100"
                          : "text-gray-600 bg-gray-100"
                      }`}
                      title={
                        category.showOnLanding
                          ? "Hide from landing"
                          : "Show on landing"
                      }
                    >
                      {category.showOnLanding ? (
                        <Eye size={18} />
                      ) : (
                        <EyeOff size={18} />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveOrder(category.id, "up")}
                        disabled={category.order === 0}
                        className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <span className="text-sm font-medium w-8 text-center bg-gray-100 rounded-md py-1">
                        {category.order + 1}
                      </span>
                      <button
                        onClick={() => moveOrder(category.id, "down")}
                        disabled={category.order === categories.length - 1}
                        className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
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

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4 font-semibold text-lg">
              No categories found
            </p>
            <p className="text-sm text-gray-500">
              Get started by creating your first category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
