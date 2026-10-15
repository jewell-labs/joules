import { createRouter as createTanStackRouter } from '@tanstack/solid-router'
import { routeTree } from './routeTree.gen'
import { ErrorPage, NotFoundPage } from '~/ui/fallback'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    defaultErrorComponent: ErrorPage,
    defaultNotFoundComponent: NotFoundPage,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  return router
}

declare module '@tanstack/solid-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
