import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { requireAuth } from '../middleware/auth'
import { UnauthorizedError, deleteUser } from '../services/users'

export const userRoutes = new Hono().post(
  '/users/delete',
  describeRoute({
    tags: ['Users'],
    summary: 'Delete user',
    description: 'Deletes a user account',
    responses: {
      200: { description: 'Deleted successfully' },
      400: { description: 'Invalid request' },
      401: { description: 'Unauthorized' },
      500: { description: 'Server error' },
    },
  }),
  requireAuth,
  async (c) => {
    const body = await c.req.json()
    const userId = body?.userId

    if (!userId || typeof userId !== 'string') {
      return c.json({ success: false, error: 'User ID is required' }, 400)
    }

    const session = c.get('session')

    try {
      await deleteUser(session.user.id, userId)
      return c.json({ success: true })
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return c.json({ success: false, error: 'Unauthorized' }, 401)
      }
      return c.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to delete user' },
        500,
      )
    }
  },
)
