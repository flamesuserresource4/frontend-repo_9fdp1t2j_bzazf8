import React, { useState } from 'react'
import { Button, Card, Input, SectionTitle } from './ui'
import { useFirebase } from './FirebaseContext'

export default function ConnectPanel() {
  const { setConnection, appId, status, error } = useFirebase()
  const [local, setLocal] = useState({ __app_id: '', __firebase_config: '', __initial_auth_token: '' })

  const handleApply = () => {
    try {
      const parsed = local.__firebase_config ? JSON.parse(local.__firebase_config) : null
      setConnection({ appId: local.__app_id, firebaseConfig: parsed, initialAuthToken: local.__initial_auth_token })
    } catch (e) {
      alert('Invalid Firebase config JSON')
    }
  }

  return (
    <Card className="p-6">
      <SectionTitle>Connect to Firebase</SectionTitle>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/70 text-sm mb-2">__app_id</label>
          <Input value={local.__app_id} onChange={(e) => setLocal({ ...local, __app_id: e.target.value })} placeholder="your-app-id" />
        </div>
        <div>
          <label className="block text-white/70 text-sm mb-2">__initial_auth_token (optional)</label>
          <Input value={local.__initial_auth_token} onChange={(e) => setLocal({ ...local, __initial_auth_token: e.target.value })} placeholder="custom token or leave blank" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-white/70 text-sm mb-2">__firebase_config (JSON)</label>
          <textarea className="w-full h-40 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20" value={local.__firebase_config} onChange={(e) => setLocal({ ...local, __firebase_config: e.target.value })} placeholder='{"apiKey":"...","authDomain":"...",...}' />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={handleApply}>Apply & Initialize</Button>
        <span className="text-white/60 text-sm">Status: {status}</span>
        {error ? <span className="text-red-400 text-sm">{error}</span> : null}
      </div>
    </Card>
  )
}
