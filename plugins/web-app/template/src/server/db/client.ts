import { drizzle } from 'drizzle-orm/d1'
import { env } from 'cloudflare:workers'

export function db() {
  return drizzle(env.DB)
}
