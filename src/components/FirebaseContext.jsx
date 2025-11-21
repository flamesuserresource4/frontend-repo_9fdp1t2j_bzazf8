import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { initializeApp, deleteApp, getApps } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const FirebaseCtx = createContext(null)

export function FirebaseProvider({ children }) {
  const [config, setConfig] = useState(() => {
    try {
      const stored = localStorage.getItem('fb_config_v1')
      return stored ? JSON.parse(stored) : { appId: '', firebaseConfig: null, initialAuthToken: '' }
    } catch {
      return { appId: '', firebaseConfig: null, initialAuthToken: '' }
    }
  })
  const [app, setApp] = useState(null)
  const [auth, setAuth] = useState(null)
  const [db, setDb] = useState(null)
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('idle') // idle | initializing | ready | error
  const [error, setError] = useState('')

  useEffect(() => {
    // Initialize/Reset when config changes
    let cancelled = false
    async function init() {
      if (!config?.firebaseConfig) return
      setStatus('initializing')
      setError('')
      try {
        // Clean any previous app if different
        let fbApp = null
        if (getApps().length) {
          // Try to find existing matching app by options
          fbApp = getApps()[0]
          // If existing app options don't match, delete and recreate
          try {
            const same = JSON.stringify(fbApp.options) === JSON.stringify(config.firebaseConfig)
            if (!same) {
              await deleteApp(fbApp)
              fbApp = initializeApp(config.firebaseConfig)
            }
          } catch {
            // If comparison fails, re-init
            try { await deleteApp(fbApp) } catch {}
            fbApp = initializeApp(config.firebaseConfig)
          }
        } else {
          fbApp = initializeApp(config.firebaseConfig)
        }
        const fbAuth = getAuth(fbApp)
        const fbDb = getFirestore(fbApp)
        setApp(fbApp)
        setAuth(fbAuth)
        setDb(fbDb)
        // Auth
        let unsub = () => {}
        await new Promise((resolve) => {
          unsub = onAuthStateChanged(fbAuth, async (u) => {
            if (u) {
              setUser(u)
              setStatus('ready')
              resolve(null)
            } else {
              try {
                if (config.initialAuthToken) {
                  await signInWithCustomToken(fbAuth, config.initialAuthToken)
                } else {
                  await signInAnonymously(fbAuth)
                }
              } catch (e) {
                setError(e?.message || 'Auth error')
                setStatus('error')
                resolve(null)
              }
            }
          })
        })
        return () => unsub()
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Initialization error')
          setStatus('error')
        }
      }
    }
    init()
    return () => { cancelled = true }
  }, [config])

  const value = useMemo(() => ({
    app, auth, db, user, status, error,
    appId: config.appId || '',
    setConnection: (next) => {
      const merged = { ...config, ...next }
      localStorage.setItem('fb_config_v1', JSON.stringify(merged))
      setConfig(merged)
    },
    clearConnection: () => {
      localStorage.removeItem('fb_config_v1')
      setConfig({ appId: '', firebaseConfig: null, initialAuthToken: '' })
    }
  }), [app, auth, db, user, status, error, config])

  return (
    <FirebaseCtx.Provider value={value}>
      {children}
    </FirebaseCtx.Provider>
  )
}

export function useFirebase() {
  return useContext(FirebaseCtx)
}
