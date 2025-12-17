"use client";

import { useEffect, useState, useRef } from "react";
import { Trash2, Upload, ArrowUp, ArrowDown, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface CoverPhoto {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  link: string | null;
  order: number;
  active: boolean;
}

export default function CoverPhotosPage() {
  const [photos, setPhotos] = useState<CoverPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const updateTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await fetch("/api/admin/cover-photos");
      if (response.ok) {
        const data = await response.json();
        setPhotos(
          data.sort((a: CoverPhoto, b: CoverPhoto) => a.order - b.order),
        );
      }
    } catch (error) {
      console.error("Failed to fetch cover photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "cover-photos");

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      // Create cover photo
      const createResponse = await fetch("/api/admin/cover-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: data.url,
          title: "",
          subtitle: "",
          order: photos.length,
          active: true,
        }),
      });

      if (createResponse.ok) {
        fetchPhotos();
      } else {
        throw new Error("Failed to create cover photo");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cover photo?")) return;

    try {
      const response = await fetch(`/api/admin/cover-photos/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPhotos();
      }
    } catch (error) {
      console.error("Failed to delete cover photo:", error);
    }
  };

  const handleUpdate = async (
    id: string,
    data: Partial<CoverPhoto>,
    skipRefetch = false,
  ) => {
    try {
      const response = await fetch(`/api/admin/cover-photos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok && !skipRefetch) {
        fetchPhotos();
      }

      return response.ok;
    } catch (error) {
      console.error("Failed to update cover photo:", error);
      return false;
    }
  };

  const handleInputChange = (
    id: string,
    field: keyof CoverPhoto,
    value: string,
  ) => {
    // Update local state immediately for responsive UI
    setPhotos((prevPhotos) =>
      prevPhotos.map((photo) =>
        photo.id === id ? { ...photo, [field]: value } : photo,
      ),
    );

    // Clear existing timer for this photo
    if (updateTimers.current[id]) {
      clearTimeout(updateTimers.current[id]);
    }

    // Set new timer to update after user stops typing
    updateTimers.current[id] = setTimeout(() => {
      handleUpdate(id, { [field]: value }, true);
      delete updateTimers.current[id];
    }, 500);
  };

  const moveOrder = async (id: string, direction: "up" | "down") => {
    const photo = photos.find((p) => p.id === id);
    if (!photo) return;

    const newOrder = direction === "up" ? photo.order - 1 : photo.order + 1;
    const otherPhoto = photos.find((p) => p.order === newOrder);

    if (otherPhoto) {
      // Update both orders without refetching in between
      const success1 = await handleUpdate(
        otherPhoto.id,
        { order: photo.order },
        true,
      );
      const success2 = await handleUpdate(id, { order: newOrder }, true);

      // Only refetch once after both updates
      if (success1 && success2) {
        fetchPhotos();
      }
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-10 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-64 mt-2 animate-pulse"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200"
            >
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="h-10 bg-gray-200 rounded-lg w-full animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded-lg w-full animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded-lg w-full animate-pulse"></div>
                <div className="flex items-center gap-2 pt-2">
                  <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded-lg w-20 ml-auto animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
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
            Cover Photos
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Manage the hero images on your landing page.
          </p>
        </div>
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="hidden"
            id="cover-upload"
          />
          <label
            htmlFor="cover-upload"
            className="flex items-center gap-2 bg-black text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={20} />
                <span>Upload New Photo</span>
              </>
            )}
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50/50 border border-red-200/50 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-pulse">
          <AlertCircle size={20} className="text-red-500" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200"
          >
            <div className="relative h-48 bg-gray-100">
              <img
                src={photo.imageUrl}
                alt={photo.title || "Cover photo"}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() =>
                    handleUpdate(photo.id, { active: !photo.active })
                  }
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    photo.active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {photo.active ? "Active" : "Inactive"}
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={photo.title || ""}
                  onChange={(e) =>
                    handleInputChange(photo.id, "title", e.target.value)
                  }
                  placeholder="Title (optional)"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-black outline-none transition-colors duration-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={photo.subtitle || ""}
                  onChange={(e) =>
                    handleInputChange(photo.id, "subtitle", e.target.value)
                  }
                  placeholder="Subtitle (optional)"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-black outline-none transition-colors duration-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Link (optional)
                </label>
                <input
                  type="text"
                  value={photo.link || ""}
                  onChange={(e) =>
                    handleInputChange(photo.id, "link", e.target.value)
                  }
                  placeholder="/products/..."
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-black outline-none transition-colors duration-300"
                />
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => moveOrder(photo.id, "up")}
                  disabled={photo.order === 0}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <ArrowUp size={18} />
                </button>
                <button
                  onClick={() => moveOrder(photo.id, "down")}
                  disabled={photo.order === photos.length - 1}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <ArrowDown size={18} />
                </button>
                <span className="text-xs text-gray-500 ml-auto">
                  Order: {photo.order + 1}
                </span>
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {photos.length === 0 && (
        <div className="text-center py-12 md:py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="text-gray-400" size={32} />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">
              No cover photos found
            </h2>
            <p className="text-gray-500 mb-6">
              Upload your first cover photo to get started.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
