import Card from '@mui/joy/Card'
import CardContent from '@mui/joy/CardContent'
import Skeleton from '@mui/joy/Skeleton'
import Stack from '@mui/joy/Stack'

export default function SkeletonCard() {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" mb={1}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 'sm' }} />
        </Stack>
        <Skeleton variant="text" width="80%" sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width={64} height={32} sx={{ borderRadius: 'sm' }} />
      </CardContent>
    </Card>
  )
}
