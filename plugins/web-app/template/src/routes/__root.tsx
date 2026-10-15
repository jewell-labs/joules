import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/solid-router'

import { HydrationScript } from 'solid-js/web'
import { Suspense } from 'solid-js'

import styleCss from '../styles/app.css?url'

export const Route = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: '__APP_TITLE__' },
      { name: 'theme-color', content: '#111111' },
    ],
    links: [
      { rel: 'stylesheet', href: styleCss },
      { rel: 'manifest', href: '/manifest.webmanifest' },
    ],
  }),
  headers: () => ({
    'Cache-Control': 'private, no-store',
  }),
  shellComponent: RootComponent,
})

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HydrationScript />
        <HeadContent />
      </head>
      <body>
        <Suspense>
          <Outlet />
        </Suspense>
        <Scripts />
      </body>
    </html>
  )
}
