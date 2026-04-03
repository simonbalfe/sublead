import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { optionalAuth } from '../middleware/auth'

export const serverInfoRoutes = new Hono().get(
  '/server-info',
  describeRoute({
    tags: ['Server'],
    summary: 'Get server info',
    description: 'Returns server time, user agent, and auth status',
    responses: { 200: { description: 'Server info' } },
  }),
  optionalAuth,
  async (c) => {
    const session = c.get('session')

    return c.json({
      serverTime: new Date().toISOString(),
      userAgent: c.req.header('user-agent') ?? 'Unknown',
      isAuthenticated: !!session?.user,
      userName: session?.user?.name ?? null,
    })
  },
)
