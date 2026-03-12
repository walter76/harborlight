import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { useServices } from './hooks/useServices'
import StatusBar from './components/StatusBar'
import ServiceGrid from './components/ServiceGrid'

function App() {
  const { services, loading, error } = useServices()

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, py: 4 }}>
      <Typography level="h1" mb={1}>Harborlight</Typography>
      {!loading && !error && <StatusBar services={services} />}
      <ServiceGrid services={services} loading={loading} error={error} />
    </Box>
  )
}

export default App
