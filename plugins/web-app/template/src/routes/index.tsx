import { createFileRoute } from '@tanstack/solid-router'
import { createResource, onMount } from 'solid-js'
import { ready } from '~/lib/ready'
import { health } from '~/server/functions/health'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [status] = createResource(health)
  onMount(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')
  })
  const report = () => {
    if (status.error) return 'Server not ready.'
    const value = status()
    if (value === undefined) return 'Checking the server.'
    return `Server ${ready(Boolean(value.ok))}.`
  }
  return (
    <main>
      <h1>{'__APP_TITLE__'}</h1>
      <p class="lede">This screen reports whether the app is up.</p>
      <p class="status" role="status">
        {report()}
      </p>
    </main>
  )
}
