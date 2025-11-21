import React, { useMemo, useState } from 'react'
import Hero from './components/Hero'
import ConnectPanel from './components/ConnectPanel'
import Inventory from './components/Inventory'
import CartDrawer from './components/CartDrawer'
import Admin from './components/Admin'
import { FirebaseProvider, useFirebase } from './components/FirebaseContext'

function AppInner() {
  const [showCart, setShowCart] = useState(false)
  const [started, setStarted] = useState(false)
  const { status } = useFirebase()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="relative">
        <Hero onStart={() => setStarted(true)} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 -mt-24 space-y-6">
        <ConnectPanel />
        {status === 'ready' && started ? (
          <>
            <Inventory onOpenCart={() => setShowCart(true)} />
            <Admin />
          </>
        ) : (
          <div className="text-white/70 text-center py-10">Connect to Firebase to load inventory and bookings.</div>
        )}
      </div>

      {/* Cart drawer would be controlled inside Inventory in a fuller implementation */}
      <CartDrawer open={false} onClose={() => setShowCart(false)} cart={{}} numDays={1} onConfirm={() => {}} />
    </div>
  )
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppInner />
    </FirebaseProvider>
  )
}
