import React, { useEffect, useMemo, useState } from 'react'
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import { useFirebase } from './FirebaseContext'
import { Button, Card, Input, SectionTitle, Select } from './ui'

const statuses = ['Pending Admin Review','Confirmed','Out for Delivery/Pickup','Completed','Canceled']

export default function Admin() {
  const { db, appId } = useFirebase()
  const [bookings, setBookings] = useState([])
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('All')
  const basePath = useMemo(() => `/artifacts/${appId}/public/data`, [appId])

  useEffect(() => {
    if (!db || !appId) return
    const bRef = collection(db, basePath, 'bookings')
    const unsubB = onSnapshot(query(bRef, orderBy('createdAt','desc')), (snap) => {
      const arr = []
      snap.forEach((d)=> arr.push({ id: d.id, ...d.data() }))
      setBookings(arr)
    })
    const iRef = collection(db, basePath, 'decor_inventory')
    const unsubI = onSnapshot(query(iRef, orderBy('name')), (snap) => {
      const arr = []
      snap.forEach((d)=> arr.push({ id: d.id, ...d.data() }))
      setItems(arr)
    })
    return () => { unsubB(); unsubI() }
  }, [db, appId, basePath])

  async function updateStatus(id, status) {
    const ref = doc(collection(db, basePath, 'bookings'), id)
    await updateDoc(ref, { status })
  }

  const pendingCount = bookings.filter(b => b.status === 'Pending Admin Review').length

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between">
        <SectionTitle>Admin Dashboard</SectionTitle>
        <div className="text-white/90">New Pending: <span className="ml-2 inline-flex items-center justify-center text-xs px-2 py-1 rounded-full bg-[#1b263b] text-white">{pendingCount}</span></div>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Bookings</h3>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-48">
              {['All', ...statuses].map((s)=> <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div className="mt-4 divide-y divide-white/10">
            {bookings.filter(b => filter==='All' || b.status===filter).map((b)=> (
              <div key={b.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{b.userName} • ${Number(b.totalPrice||0).toFixed(2)}</div>
                    <div className="text-white/60 text-sm">{new Date(b.startDate?.toDate?.()||b.startDate).toLocaleDateString()} → {new Date(b.endDate?.toDate?.()||b.endDate).toLocaleDateString()} • {b.fulfillmentMethod}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white">{b.status}</span>
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {statuses.map((s)=> (
                    <Button key={s} onClick={()=>updateStatus(b.id, s)} className={`text-sm ${b.status===s?'bg-[#1b263b]':'bg-white/10 hover:bg-white/20'}`}>{s}</Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Inventory</h3>
            <div className="text-white/60 text-sm">{items.length} items</div>
          </div>
          <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {items.map((it)=> (
              <div key={it.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{it.name}</div>
                    <div className="text-white/60 text-sm">{it.category} • Stock {it.totalStock} • ${Number(it.pricePerDay||0).toFixed(2)}/day</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}
