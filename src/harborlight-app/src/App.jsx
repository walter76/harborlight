import Box from '@mui/joy/Box'
import Typography from '@mui/joy/Typography'
import { useApps } from './hooks/useApps'
import StatusBar from './components/StatusBar'
import AppGrid from './components/AppGrid'

function App() {
  const { apps, loading, error } = useApps()

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, py: 4 }}>
      <Typography level="h1" mb={1}>Harborlight</Typography>
      {!loading && !error && <StatusBar apps={apps} />}
      <AppGrid apps={apps} loading={loading} error={error} />
    </Box>
  )
}

export default App
