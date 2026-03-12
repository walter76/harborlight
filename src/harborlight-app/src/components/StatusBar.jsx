import Typography from '@mui/joy/Typography'

export default function StatusBar({ services }) {
  const enabled = services.filter(s => s.status === 'enabled').length
  return (
    <Typography level="body-sm" mb={2}>
      {enabled} of {services.length} services enabled
    </Typography>
  )
}
