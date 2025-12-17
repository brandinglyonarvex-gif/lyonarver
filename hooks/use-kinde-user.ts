"use client"

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { useEffect, useState } from "react"

interface DBUser {
  id: string
  kindeId: string
  email: string
  name: string | null
  phone: string | null
  image: string | null
  createdAt: string
}

export function useKindeUser() {
  const { user: kindeUser, isAuthenticated, isLoading } = useKindeBrowserClient()
  const [dbUser, setDbUser] = useState<DBUser | null>(null)
  const [dbLoading, setDbLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchDBUser = async () => {
      if (isLoading) {
        setDbLoading(true)
        return
      }

      if (!isAuthenticated || !kindeUser?.id) {
        if (!cancelled) {
          setDbUser(null)
          setDbLoading(false)
        }
        return
      }

      try {
        setDbLoading(true)
        const response = await fetch("/api/auth/me")
        if (!cancelled) {
          if (response.ok) {
            const user = await response.json()
            setDbUser(user)
            setError(null)
          } else {
            setDbUser(null)
            setError("Failed to fetch user")
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch user")
        }
      } finally {
        if (!cancelled) {
          setDbLoading(false)
        }
      }
    }

    fetchDBUser()

    return () => {
      cancelled = true
    }
  }, [kindeUser?.id, isAuthenticated, isLoading])

  return {
    isSignedIn: Boolean(isAuthenticated && dbUser),
    user: dbUser,
    kindeUser,
    loading: Boolean(isLoading) || dbLoading,
    error,
  }
}

