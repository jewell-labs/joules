import { McpServer } from '@modelcontextprotocol/server'
import { createMcpHandler } from 'agents/mcp/server'
import { z } from 'zod'

export const mcpPath = '/mcp'

function createServer() {
  const server = new McpServer({
    name: '__APP_NAME__',
    version: '0.1.0',
  })
  const output = { ok: true as const }
  server.registerTool(
    'healthcheck',
    {
      description: 'Report that this app is up.',
      inputSchema: z.object({}),
      outputSchema: z.object({ ok: z.literal(true) }),
    },
    async () => ({
      content: [{ type: 'text', text: JSON.stringify(output) }],
      structuredContent: output,
    }),
  )
  return server
}

export const mcpHandler = createMcpHandler(createServer, { route: mcpPath })
