import Typography from '@mui/joy/Typography'

export default function StatusBar({ apps }) {
  const enabled = apps.filter(s => s.status === 'enabled').length
  return (
    <Typography level="body-sm" mb={2}>
      {enabled} of {apps.length} web apps enabled
    </Typography>
  )
}
