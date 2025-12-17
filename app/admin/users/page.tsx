"use client"

import { useEffect, useState } from "react"
import { Users, Mail, Calendar, Search, AlertCircle } from "lucide-react"

interface User {
  id: string
  kindeId: string
  email: string
  name: string | null
  phone: string | null
  image: string | null
  createdAt: string
  _count?: {
    orders: number
    reviews: number
    wishlist: number
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setError(null)
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        setError("Failed to load users. Please try again.")
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      setError("An error occurred while loading users.")
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(search.toLowerCase()))
  )

  if (loading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <div className="h-10 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-64 mt-2 animate-pulse"></div>
          </div>
        </div>

        <div className="mb-6">
          <div className="h-12 bg-gray-200 rounded-lg w-full animate-pulse"></div>
        </div>

        <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
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
                {[...Array(5)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded-lg w-16 animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-gray-200 rounded-lg w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-gray-200 rounded-lg w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
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
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-6 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="h-4 bg-gray-200 rounded-lg w-16 mb-2 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded-lg w-12 animate-pulse"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded-lg w-16 mb-2 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded-lg w-12 animate-pulse"></div>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
            Users
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Manage and view all registered users
          </p>
        </div>
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
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-black transition-colors duration-300 text-sm md:text-base"
        />
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  Reviews
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || user.email}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 text-sm font-medium">
                            {(user.name || user.email || "U")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">
                          {user.name || "No name"}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          ID: {user.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span className="text-gray-700">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {user.phone || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {user._count?.orders || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      {user._count?.reviews || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200"
          >
            <div className="flex items-start gap-3 mb-4">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || user.email}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {(user.name || user.email || "U")[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1 truncate text-gray-800">
                  {user.name || "No name"}
                </h3>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200/80">
              <div>
                <p className="text-xs text-gray-500 mb-1">Orders</p>
                <p className="font-bold text-lg">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                    {user._count?.orders || 0}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Reviews</p>
                <p className="font-bold text-lg">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    {user._count?.reviews || 0}
                  </span>
                </p>
              </div>
              {user.phone && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="text-sm font-medium text-gray-700">
                    {user.phone}
                  </p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Joined</p>
                <p className="text-sm font-medium text-gray-700">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12 md:py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-gray-400" size={32} />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">
              No users found
            </h2>
            <p className="text-gray-500">
              {search
                ? `Your search for "${search}" did not match any users.`
                : "When a new user signs up, they will appear here."}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}







