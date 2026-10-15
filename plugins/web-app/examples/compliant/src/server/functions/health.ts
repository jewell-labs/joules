import { createServerFn } from '@tanstack/solid-start'
import { authPolicy } from '../auth/policy'
import { db } from '../db/client'

export const health = createServerFn({ method: 'GET' }).handler(async () => {
  db()
  return { ok: true, auth: authPolicy.primary }
})
