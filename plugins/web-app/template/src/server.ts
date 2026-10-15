import handler from '@tanstack/solid-start/server-entry'
import { mcpHandler, mcpPath } from './server/mcp'

export default {
  fetch(request: Request) {
    if (new URL(request.url).pathname === mcpPath) {
      return mcpHandler.fetch(request)
    }
    return handler.fetch(request)
  },
}
