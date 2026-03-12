import Card from '@mui/joy/Card'
import CardContent from '@mui/joy/CardContent'
import Typography from '@mui/joy/Typography'
import Button from '@mui/joy/Button'
import Stack from '@mui/joy/Stack'
import HealthChip from './HealthChip'

export default function AppCard({ app }) {
  const { name, url, status, navigable } = app

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography level="title-md">{name}</Typography>
          <HealthChip status={status} />
        </Stack>
        <Typography level="body-sm" noWrap title={url ?? ''} mb={2}>
          {url ?? '—'}
        </Typography>
        <Button
          size="sm"
          variant="soft"
          disabled={!navigable}
          onClick={() => window.open(url, '_blank')}
        >
          Open
        </Button>
      </CardContent>
    </Card>
  )
}
