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
  return (
    <main>
      <h1>__APP_TITLE__</h1>
      <p>Server {ready(Boolean(status()?.ok))}.</p>
    </main>
  )
}
