"use client"

import { useEffect, useState } from "react"

interface User {
  id: string
  email: string
  name: string
  phone?: string
  createdAt?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setUser(data)
        } else {
          setUser(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch user")
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, loading, error }
}
