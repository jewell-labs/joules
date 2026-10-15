import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/solid-router'

import { HydrationScript } from 'solid-js/web'
import { Suspense } from 'solid-js'

import styleCss from '../styles/app.css?url'
import { ErrorPage, NotFoundPage } from '~/ui/fallback'

export const Route = createRootRouteWithContext()({
  errorComponent: ErrorPage,
  notFoundComponent: NotFoundPage,
  head: () => ({
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'color-scheme', content: 'light dark' },
      { title: '__APP_TITLE__' },
      { tagName: 'meta', name: 'theme-color', content: '#f3f4f6', media: '(prefers-color-scheme: light)' },
      { tagName: 'meta', name: 'theme-color', content: '#101318', media: '(prefers-color-scheme: dark)' },
    ],
    links: [
      { rel: 'stylesheet', href: styleCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
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
