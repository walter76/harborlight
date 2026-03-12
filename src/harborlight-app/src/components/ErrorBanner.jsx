import Alert from '@mui/joy/Alert'

export default function ErrorBanner({ message }) {
  return (
    <Alert color="danger">
      Failed to load apps: {message}
    </Alert>
  )
}
