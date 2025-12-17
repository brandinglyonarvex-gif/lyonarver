"use client"

import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs"
import { Button } from "@/components/ui/button"

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-600 mb-8">Sign up for your LyonArvex account</p>
          
          <div className="space-y-4">
            <RegisterLink className="w-full">
              <Button className="w-full bg-black hover:bg-gray-800 text-white">
                Sign Up with Kinde
              </Button>
            </RegisterLink>
            
            <p className="text-center text-gray-600 text-sm">
              Already have an account?{" "}
              <RegisterLink className="text-black font-semibold hover:underline">
                Sign in here
              </RegisterLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
