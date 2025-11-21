import React from 'react'
import { Button, Card } from './ui'

export default function CartDrawer({ open, onClose, cart, numDays, onConfirm }) {
  if (!open) return null
  const entries = Object.values(cart || {})
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-white/10 p-6 overflow-y-auto">
        <h3 className="text-xl text-white font-semibold">Your Cart</h3>
        <div className="mt-4 space-y-3">
          {entries.length === 0 ? (
            <Card className="p-4 text-white/70">No items selected</Card>
          ) : entries.map(({ item, quantity }) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{item.name}</div>
                  <div className="text-white/60 text-sm">{quantity} x ${Number(item.pricePerDay || 0).toFixed(2)} / day</div>
                </div>
                <div className="text-white font-semibold">${(quantity * Number(item.pricePerDay || 0) * numDays).toFixed(2)}</div>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-6">
          <Button onClick={onConfirm} className="w-full bg-[#1b263b] hover:bg-[#0d1b2a]">Confirm Booking & Proceed to Payment</Button>
        </div>
      </div>
    </div>
  )
}
