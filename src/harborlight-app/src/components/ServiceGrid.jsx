import Box from '@mui/joy/Box'
import ServiceCard from './ServiceCard'
import SkeletonCard from './SkeletonCard'
import ErrorBanner from './ErrorBanner'

export default function ServiceGrid({ services, loading, error }) {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  }

  if (loading) {
    return (
      <Box sx={gridStyle}>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </Box>
    )
  }

  if (error) {
    return <ErrorBanner message={error} />
  }

  return (
    <Box sx={gridStyle}>
      {services.map(s => <ServiceCard key={s.id} service={s} />)}
    </Box>
  )
}
