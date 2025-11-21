import React from 'react'
import { motion } from 'framer-motion'

export function Button({ children, className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-xl bg-[#2F3E46] text-white hover:bg-[#354f52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur p-4 ${className}`}>
      {children}
    </div>
  )
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function SectionTitle({ children }) {
  return (
    <h2 className="text-xl font-semibold text-white/90 mb-3">{children}</h2>
  )
}
