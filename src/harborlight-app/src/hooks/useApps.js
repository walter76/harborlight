import { useState, useEffect } from 'react'

function deriveUrl(scheme, port, rule_part) {
  const defaultPort = scheme === 'https' ? 443 : 80
  const portSuffix = port !== defaultPort ? `:${port}` : ''
  if (!rule_part) return null
  if (rule_part.FullUrl) return `${scheme}://${rule_part.FullUrl}${portSuffix}`
  if (rule_part.Host) return `${scheme}://${rule_part.Host}${portSuffix}`
  if (rule_part.PathPrefix) return rule_part.PathPrefix
  if (rule_part.Unknown) return rule_part.Unknown
  return null
}

function isNavigable(rule_part) {
  if (!rule_part) return false
  return !!(rule_part.FullUrl || rule_part.Host)
}

export function useApps() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchApps() {
    try {
      const res = await fetch('/api/apps')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const normalized = data.map(s => ({
        ...s,
        url: deriveUrl(s.scheme, s.port, s.rule_part),
        navigable: isNavigable(s.rule_part),
      }))
      setApps(normalized)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApps()
    const interval = setInterval(fetchApps, 30000)
    return () => clearInterval(interval)
  }, [])

  return { apps, loading, error }
}
