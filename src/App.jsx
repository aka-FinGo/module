import { useState, useEffect } from 'react'
import Constructor from './pages/Constructor'
import Admin from './pages/Admin'

export default function App() {
  const [page, setPage] = useState(
    window.location.hash === '#admin' ? 'admin' : 'constructor'
  )

  useEffect(() => {
    const handler = () => {
      setPage(window.location.hash === '#admin' ? 'admin' : 'constructor')
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  return page === 'admin'
    ? <Admin onExit={() => { window.location.hash = ''; setPage('constructor') }} />
    : <Constructor onAdmin={() => { window.location.hash = 'admin'; setPage('admin') }} />
}
