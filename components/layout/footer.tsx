"use client"

import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Mail, Sparkles, ArrowRight, Shield, Truck, Award, Headphones } from "lucide-react"
import { useState } from "react"

export function Footer() {
  const [email, setEmail] = useState("")

  const socialLinks = [
    { icon: Facebook, href: "#", color: "hover:text-blue-500" },
    { icon: Twitter, href: "#", color: "hover:text-sky-400" },
    { icon: Instagram, href: "#", color: "hover:text-pink-500" },
    { icon: Linkedin, href: "#", color: "hover:text-blue-600" },
  ]

  return (
    <footer className="relative bg-gradient-to-b from-black via-gray-900 to-black text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="relative container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 text-center md:text-left">
          {/* Brand */}
          <div className="space-y-6 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-white/10 to-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                LyonArvex
              </h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Premium e-commerce destination for quality products and exceptional service. Experience luxury shopping redefined.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className={`p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-110 hover:-translate-y-1 ${social.color}`}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-bold text-lg mb-6 relative inline-block">
              Quick Links
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-white to-transparent"></span>
            </h4>
            <ul className="space-y-3">
              {[
                { name: "Shop", href: "/products" },
                { name: "About Us", href: "/about" },
                { name: "Contact", href: "/contact" },
                { name: "FAQ", href: "/faq" },
              ].map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300 text-sm"
                  >
                    <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-bold text-lg mb-6 relative inline-block">
              Customer Service
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-white to-transparent"></span>
            </h4>
            <ul className="space-y-3">
              {[
                { name: "Shipping Info", href: "/shipping", icon: Truck },
                { name: "Returns", href: "/returns", icon: ArrowRight },
                { name: "Privacy Policy", href: "/privacy", icon: Shield },
                { name: "Terms & Conditions", href: "/terms", icon: Award },
              ].map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300 text-sm"
                  >
                    <link.icon size={14} className="opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-bold text-lg mb-6 relative inline-block">
              Stay Connected
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-white to-transparent"></span>
            </h4>
            <p className="text-gray-400 text-sm mb-6">
              Subscribe to get exclusive offers, new arrivals, and special discounts delivered to your inbox.
            </p>
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                // Handle newsletter subscription
                setEmail("")
              }}
              className="space-y-3 w-full max-w-sm"
            >
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-white/30 focus:bg-white/10 outline-none transition-all duration-300 text-sm placeholder-gray-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-white to-gray-200 text-black px-6 py-3 rounded-xl font-semibold hover:from-gray-100 hover:to-white transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg shadow-white/10 hover:shadow-white/20"
              >
                Subscribe
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </form>
          </div>
        </div>

        {/* Features Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12 pb-12 border-t border-white/10 pt-12">
          {[
            { icon: Truck, title: "Free Shipping", desc: "On orders over $100" },
            { icon: Shield, title: "Secure Payment", desc: "100% protected" },
            { icon: Headphones, title: "24/7 Support", desc: "Always here to help" },
            { icon: Award, title: "Quality Guarantee", desc: "Premium products" },
          ].map((feature, index) => (
            <div
              key={index}
              className="text-center p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 group"
            >
              <div className="inline-flex p-3 bg-gradient-to-br from-white/10 to-white/5 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon size={24} className="text-white" />
              </div>
              <h5 className="font-semibold mb-1 text-sm">{feature.title}</h5>
              <p className="text-xs text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} LyonArvex. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs text-gray-500">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/cookies" className="hover:text-white transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
