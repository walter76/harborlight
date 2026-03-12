import Chip from '@mui/joy/Chip'

const STATUS_COLOR = {
  enabled: 'success',
  disabled: 'warning',
}

export default function HealthChip({ status }) {
  return (
    <Chip color={STATUS_COLOR[status] ?? 'neutral'} size="sm">
      {status}
    </Chip>
  )
}
