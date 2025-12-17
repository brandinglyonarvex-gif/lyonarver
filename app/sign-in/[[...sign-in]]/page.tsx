"use client"

import { LoginLink } from "@kinde-oss/kinde-auth-nextjs"
import { Button } from "@/components/ui/button"

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-gray-600 mb-8">Sign in to your LyonArvex account</p>
          
          <div className="space-y-4">
            <LoginLink className="w-full">
              <Button className="w-full bg-black hover:bg-gray-800 text-white">
                Sign In with Kinde
              </Button>
            </LoginLink>
            
            <p className="text-center text-gray-600 text-sm">
              Don't have an account?{" "}
              <LoginLink className="text-black font-semibold hover:underline">
                Sign up here
              </LoginLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
