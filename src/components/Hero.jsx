import React from 'react'
import Spline from '@splinetool/react-spline'
import { Button } from './ui'

export default function Hero({ onStart }) {
  return (
    <section className="relative min-h-[70vh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/cEecEwR6Ehj4iT8T/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 flex flex-col md:flex-row items-center gap-10">
        <div className="w-full md:w-1/2">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            Elevated Event Decor
          </h1>
          <p className="mt-4 text-white/80 text-lg md:text-xl max-w-xl">
            Rent premium decor with real-time availability. Seamless booking, transparent pricing, and concierge-level service.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Button onClick={onStart} className="bg-[#1b263b] hover:bg-[#0d1b2a] px-6 py-3 text-base rounded-2xl">
              Start Planning Your Event
            </Button>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
    </section>
  )
}
