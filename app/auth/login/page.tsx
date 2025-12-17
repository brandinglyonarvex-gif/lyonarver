'use client';

import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

type AuthMethod = 'email' | 'phone' | 'oauth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Always redirect to landing page after login
  const redirectTo = '/';
  const {
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
    signInWithEmail,
    signInWithGoogle,
    signInWithApple,
    initPhoneAuth,
    sendOTP,
    verifyOTP,
    isPhoneAuthReady,
    clearError,
  } = useAuth();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('oauth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initializingPhone, setInitializingPhone] = useState(false);
  const phoneAuthInitialized = useRef(false);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  // Callback ref to initialize phone auth when container is mounted
  const initializePhoneAuth = useCallback(async () => {
    if (phoneAuthInitialized.current || isPhoneAuthReady || initializingPhone) {
      return;
    }

    const container = document.getElementById('recaptcha-container');
    if (!container) {
      return;
    }

    setInitializingPhone(true);
    try {
      await initPhoneAuth('recaptcha-container');
      phoneAuthInitialized.current = true;
    } catch (err) {
      console.error('Failed to init phone auth:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize phone authentication');
    } finally {
      setInitializingPhone(false);
    }
  }, [initPhoneAuth, isPhoneAuthReady, initializingPhone]);

  // Initialize reCAPTCHA for phone auth when component mounts and tab is phone
  useEffect(() => {
    if (authMethod === 'phone' && !phoneAuthInitialized.current && !isPhoneAuthReady) {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      const rafId = requestAnimationFrame(() => {
        initializePhoneAuth();
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [authMethod, isPhoneAuthReady, initializePhoneAuth]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      setError(authError);
      setLoading(false);
    }
  }, [authError]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearError();
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      // Redirect handled by useEffect when isAuthenticated becomes true
    } catch {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearError();
    setLoading(true);

    try {
      await sendOTP(phone);
      setOtpSent(true);
    } catch {
      // Error handled by auth hook
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearError();
    setLoading(true);

    try {
      await verifyOTP(otp);
      // Redirect handled by useEffect when isAuthenticated becomes true
    } catch {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    clearError();
    setLoading(true);

    try {
      await signInWithGoogle();
      // Redirect handled by useEffect when isAuthenticated becomes true
    } catch {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setError('');
    clearError();
    setLoading(true);

    try {
      await signInWithApple();
      // Redirect handled by useEffect when isAuthenticated becomes true
    } catch {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-gray-600 mb-6">Sign in to your LyonArvex account</p>

          {/* Auth Method Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => {
                setAuthMethod('oauth');
                setError('');
                clearError();
              }}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                authMethod === 'oauth'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Google
            </button>
            <button
              onClick={() => {
                setAuthMethod('email');
                setError('');
                clearError();
              }}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                authMethod === 'email'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Email
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Email Auth */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-black transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-black transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <Link
                href="/auth/forgot-password"
                className="block text-center text-sm text-gray-600 hover:text-black"
              >
                Forgot password?
              </Link>
            </form>
          )}

          {/* OAuth */}
          {authMethod === 'oauth' && (
            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">Continue with Google</span>
              </button>

              <button
                onClick={handleAppleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                <span className="font-medium">Continue with Apple</span>
              </button>
            </div>
          )}

          {/* reCAPTCHA container (invisible) - must always be in DOM */}
          <div id="recaptcha-container" ref={recaptchaContainerRef} />

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-black font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
