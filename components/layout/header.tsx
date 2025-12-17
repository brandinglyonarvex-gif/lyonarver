'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Heart, User, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCartStore } from '@/lib/cart-store';
import { AnimatePresence, motion } from 'framer-motion';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { items } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartItemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const navigationLinks = [
    { name: 'Home', href: '/', id: 'home' },
    { name: 'Shop', href: '/products', id: 'shop' },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo and Brand Name */}
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.jpg" alt="LyonArvex" className="h-10 w-10 rounded-full object-cover" />
              <span className="text-xl font-semibold tracking-wide">LyonArvex</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navigationLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className={`text-sm tracking-wide uppercase transition-colors ${
                    pathname === link.href
                      ? 'text-black border-b border-black pb-1'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="flex items-center justify-center w-10 h-10 hover:bg-gray-100 rounded-full transition-colors"
                title="Wishlist"
              >
                <Heart size={20} className="text-gray-600" />
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center justify-center w-10 h-10 hover:bg-gray-100 rounded-full transition-colors"
                title="Cart"
              >
                <ShoppingCart size={20} className="text-gray-600" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>

              {/* User Account / Auth */}
              <div className="hidden md:flex items-center">
                {isLoading ? (
                  <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                ) : isAuthenticated ? (
                  <Link
                    href="/account"
                    className="flex items-center justify-center w-10 h-10 hover:bg-gray-100 rounded-full transition-colors"
                    title="Account"
                  >
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User size={20} className="text-gray-600" />
                    )}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 ml-4">
                    <Link
                      href="/auth/login"
                      className="text-sm tracking-wide uppercase text-gray-600 hover:text-black transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      className="px-4 py-2 border border-black text-black text-sm tracking-widest uppercase hover:bg-black hover:text-white transition-all duration-300 font-light"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 hover:bg-gray-100 rounded-full transition-colors z-50"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white shadow-xl p-6 pt-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.id}
                    href={link.href}
                    className={`text-xl font-light py-4 border-b border-gray-100 transition-colors ${
                      pathname === link.href ? 'text-black' : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}

                <div className="mt-auto space-y-4">
                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/account"
                        className="flex items-center gap-4 text-lg font-light text-gray-600 hover:text-black"
                      >
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="user" className="w-8 h-8 rounded-full" />
                        ) : (
                          <User size={24} />
                        )}
                        <span>{user?.displayName || user?.email || 'Account'}</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-center px-4 py-3 border border-black text-black text-sm tracking-widest uppercase hover:bg-black hover:text-white transition-all duration-300 font-light"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        className="block w-full text-center px-4 py-3 bg-black text-white text-sm tracking-widest uppercase hover:bg-gray-800 transition-colors font-light"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/register"
                        className="block w-full text-center px-4 py-3 border border-black text-black text-sm tracking-widest uppercase hover:bg-black hover:text-white transition-all duration-300 font-light"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
