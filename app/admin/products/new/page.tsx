"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Upload, X, Plus, Trash2, AlertCircle } from "lucide-react"

interface SizeInput {
  size: string
  quantity: number
}

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discount: "0",
    categoryId: "",
    featured: false,
  })
  const [images, setImages] = useState<string[]>([])
  const [sizes, setSizes] = useState<SizeInput[]>([{ size: "", quantity: 0 }])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/admin/categories")
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      }
    }
    fetchCategories()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "products")

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const data = await response.json()
        return data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setImages([...images, ...uploadedUrls])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload images")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const addSize = () => {
    setSizes([...sizes, { size: "", quantity: 0 }])
  }

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index))
  }

  const updateSize = (index: number, field: "size" | "quantity", value: string | number) => {
    const newSizes = [...sizes]
    newSizes[index] = { ...newSizes[index], [field]: value }
    setSizes(newSizes)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validate sizes
    const validSizes = sizes.filter((s) => s.size.trim() !== "" && s.quantity >= 0)
    if (validSizes.length === 0) {
      setError("Please add at least one size with quantity")
      setLoading(false)
      return
    }

    // Validate images
    if (images.length === 0) {
      setError("Please upload at least one product image")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Number.parseFloat(formData.price),
          discount: Number.parseFloat(formData.discount),
          images,
          sizes: validSizes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create product")
      }

      router.push("/admin/products")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
            Create Product
          </h1>
          <Link href="/admin/products" className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors">
            <ChevronLeft size={16} />
            <span>Back to Products</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50/50 border border-red-200/50 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-pulse">
            <AlertCircle size={20} className="text-red-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Premium Leather Watch"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-black transition-colors duration-300"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="A short description of the product..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-black transition-colors duration-300 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-black transition-colors duration-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Discount (%)</label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                placeholder="0"
                min="0"
                max="100"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-black transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Category *</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-black transition-colors duration-300 bg-white"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No categories found.{" "}
                  <Link href="/admin/categories/new" className="text-black font-semibold hover:underline">
                    Create one
                  </Link>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-8">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="w-5 h-5 text-black border-2 border-gray-300 rounded focus:ring-black focus:ring-2"
              />
              <label htmlFor="featured" className="text-sm font-semibold text-gray-700 cursor-pointer">
                Featured Product
              </label>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Product Images *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-black transition-colors duration-300">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                <span className="text-sm font-semibold text-gray-600">
                  {uploading ? "Uploading..." : "Click or drag to upload"}
                </span>
                <span className="text-xs text-gray-500 mt-1">PNG, JPG, WebP (Max 10MB each)</span>
              </label>
            </div>

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
                {images.map((url, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={url}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sizes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-700">Product Sizes & Quantities *</label>
              <button
                type="button"
                onClick={addSize}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-300"
              >
                <Plus size={16} />
                Add Size
              </button>
            </div>

            <div className="space-y-3">
              {sizes.map((size, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Size (e.g., S, M, L, XL)"
                      value={size.size}
                      onChange={(e) => updateSize(index, "size", e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-black transition-colors duration-300"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={size.quantity}
                      onChange={(e) => updateSize(index, "quantity", parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-black transition-colors duration-300"
                    />
                  </div>
                  {sizes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSize(index)}
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      title="Remove size"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200 mt-8">
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? "Creating Product..." : "Create Product"}
            </button>
            <Link
              href="/admin/products"
              className="w-full border-2 border-gray-300 text-center text-black py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
