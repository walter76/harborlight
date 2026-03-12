import { useState, useEffect } from 'react'

function deriveUrl(scheme, rule_part) {
  if (!rule_part) return null
  if (rule_part.FullUrl) return `${scheme}://${rule_part.FullUrl}`
  if (rule_part.Host) return `${scheme}://${rule_part.Host}`
  if (rule_part.PathPrefix) return rule_part.PathPrefix
  if (rule_part.Unknown) return rule_part.Unknown
  return null
}

function isNavigable(rule_part) {
  if (!rule_part) return false
  return !!(rule_part.FullUrl || rule_part.Host)
}

export function useServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchServices() {
    try {
      const res = await fetch('/api/apps')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const normalized = data.map(s => ({
        ...s,
        url: deriveUrl(s.scheme, s.rule_part),
        navigable: isNavigable(s.rule_part),
      }))
      setServices(normalized)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
    const interval = setInterval(fetchServices, 30000)
    return () => clearInterval(interval)
  }, [])

  return { services, loading, error }
}
