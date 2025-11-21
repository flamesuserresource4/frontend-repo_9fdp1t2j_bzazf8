import React, { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDocs, onSnapshot, orderBy, query, setDoc, Timestamp, where } from 'firebase/firestore'
import { useFirebase } from './FirebaseContext'
import { Button, Card, Input, SectionTitle, Select } from './ui'

function daysBetween(start, end) {
  const ms = end.getTime() - start.getTime()
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

export default function Inventory({ onOpenCart }) {
  const { db, appId, user, status } = useFirebase()
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [cart, setCart] = useState({})

  const basePath = useMemo(() => `/artifacts/${appId}/public/data`, [appId])

  useEffect(() => {
    if (!db || !appId) return
    const invRef = collection(db, basePath, 'decor_inventory')
    const q = query(invRef, orderBy('name'))
    const unsub = onSnapshot(q, (snap) => {
      const arr = []
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }))
      setItems(arr)
    })
    return () => unsub()
  }, [db, appId, basePath])

  async function checkAvailability(itemId, wantQty) {
    if (!db || !appId || !startDate || !endDate) return wantQty
    const s = new Date(startDate)
    const e = new Date(endDate)
    const bookingsRef = collection(db, basePath, 'bookings')
    const q = query(
      bookingsRef,
      where('itemsBookedIds', 'array-contains', itemId),
      where('status', 'in', ['Pending Admin Review', 'Confirmed', 'Out for Delivery/Pickup'])
    )
    const snap = await getDocs(q)
    let reserved = 0
    snap.forEach((docu) => {
      const b = docu.data()
      const bs = b.startDate?.toDate?.() || new Date(b.startDate)
      const be = b.endDate?.toDate?.() || new Date(b.endDate)
      // overlap check
      if (bs <= e && be >= s) {
        for (const it of b.itemsBooked || []) {
          if (it.itemId === itemId) reserved += Number(it.quantity || 0)
        }
      }
    })
    const item = items.find((i) => i.id === itemId)
    const available = Math.max(0, Number(item?.totalStock || 0) - reserved)
    return Math.min(wantQty, available)
  }

  function addToCart(item, qty) {
    setCart((prev) => {
      const curr = prev[item.id]?.quantity || 0
      const nextQty = Math.max(0, Math.min(999, curr + qty))
      const next = { ...prev }
      if (nextQty === 0) delete next[item.id]
      else next[item.id] = { item, quantity: nextQty }
      return next
    })
  }

  const categories = useMemo(() => ['All', ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))], [items])
  const filtered = items.filter((i) => (filter === 'All' || i.category === filter) && i.name.toLowerCase().includes(search.toLowerCase()))

  const numDays = useMemo(() => {
    if (!startDate || !endDate) return 1
    return daysBetween(new Date(startDate), new Date(endDate))
  }, [startDate, endDate])

  const totalPrice = useMemo(() => {
    return Object.values(cart).reduce((sum, entry) => sum + Number(entry.item.pricePerDay || 0) * entry.quantity * numDays, 0)
  }, [cart, numDays])

  async function handleCheckout() {
    if (!user) return alert('Please connect and sign-in first')
    if (!startDate || !endDate) return alert('Please select dates before checkout')
    const s = new Date(startDate)
    const e = new Date(endDate)
    // Re-check availability for all items
    const verified = {}
    for (const [id, entry] of Object.entries(cart)) {
      const okQty = await checkAvailability(id, entry.quantity)
      if (okQty !== entry.quantity) {
        verified[id] = { ...entry, quantity: okQty }
      }
    }
    if (Object.keys(verified).length) {
      setCart((prev) => ({ ...prev, ...verified }))
      return alert('Some items had limited availability. Quantities were adjusted.')
    }
    const itemsBooked = Object.values(cart).map(({ item, quantity }) => ({ itemId: item.id, quantity, price: Number(item.pricePerDay || 0) }))
    const itemsBookedIds = itemsBooked.map((i) => i.itemId)
    const booking = {
      userId: user.uid,
      userName: user.isAnonymous ? 'Guest' : user.displayName || 'Client',
      itemsBooked,
      itemsBookedIds,
      startDate: Timestamp.fromDate(s),
      endDate: Timestamp.fromDate(e),
      totalPrice,
      status: 'Pending Admin Review',
      fulfillmentMethod: 'Pickup',
      createdAt: Timestamp.now()
    }
    const bookingsRef = collection(db, basePath, 'bookings')
    const id = crypto.randomUUID()
    await setDoc(doc(bookingsRef, id), { bookingId: id, ...booking })
    alert('Booking created and sent for review.')
    setCart({})
  }

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 -mt-20">
      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-white/70 text-sm mb-2">Search</label>
            <Input placeholder="Search items" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">Category</label>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">Start Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">End Date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((item) => {
            const qty = cart[item.id]?.quantity || 0
            const isDateSet = !!(startDate && endDate)
            return (
              <Card key={item.id} className="p-4">
                <div className="aspect-video bg-white/5 rounded-xl overflow-hidden border border-white/10 mb-3">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-white font-medium">{item.name}</h3>
                    <p className="text-white/60 text-sm">{item.category}</p>
                  </div>
                  <div className="text-white font-semibold">${Number(item.pricePerDay || 0).toFixed(2)}/day</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button onClick={() => addToCart(item, -1)}>-</Button>
                  <div className="w-10 text-center text-white">{qty}</div>
                  <Button onClick={() => addToCart(item, 1)}>+</Button>
                </div>
                <div className="mt-3 text-white/70 text-sm">
                  {isDateSet ? `${numDays} day(s) • ${(qty * Number(item.pricePerDay || 0) * numDays).toFixed(2)}` : 'Select dates to calculate total'}
                </div>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="text-white/70">Total: <span className="text-white font-semibold">${totalPrice.toFixed(2)}</span></div>
          <div className="flex items-center gap-3">
            <Button onClick={onOpenCart} className="bg-[#1b263b] hover:bg-[#0d1b2a]">Open Cart</Button>
            <Button onClick={handleCheckout} className="bg-[#1b263b] hover:bg-[#0d1b2a]">Confirm Booking & Proceed to Payment</Button>
          </div>
        </div>
      </Card>
    </section>
  )
}
