import { onMount } from 'solid-js'

export function NotFoundPage() {
  onMount(() => {
    document.title = 'Page not found'
  })
  return (
    <main>
      <h1>Page not found</h1>
      <p class="lede">This address is not part of the app.</p>
      <a class="action" href="/">
        Back home
      </a>
    </main>
  )
}

export function ErrorPage(props: { reset: () => void }) {
  onMount(() => {
    document.title = 'This page failed'
  })
  return (
    <main>
      <h1>This page failed</h1>
      <p class="lede">The app could not finish loading this address.</p>
      <button class="action" type="button" onClick={() => props.reset()}>
        Try again
      </button>
    </main>
  )
}
