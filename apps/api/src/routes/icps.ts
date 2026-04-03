import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { db } from '../db'
import { icps } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'
import { triggerInitialSeeding } from '../services/scraper'

export const icpRoutes = new Hono()
  .get(
    '/icps',
    describeRoute({
      tags: ['Products'],
      summary: 'List products',
      responses: { 200: { description: 'List of products' } },
    }),
    requireAuth,
    async (c) => {
      const session = c.get('session')
      const rows = await db.select().from(icps).where(eq(icps.userId, session.user.id))
      return c.json({ success: true, icps: rows })
    },
  )
  .get(
    '/icps/:id',
    describeRoute({
      tags: ['Products'],
      summary: 'Get product',
      responses: { 200: { description: 'Product detail' } },
    }),
    requireAuth,
    async (c) => {
      const session = c.get('session')
      const [icp] = await db
        .select()
        .from(icps)
        .where(and(eq(icps.id, c.req.param('id')), eq(icps.userId, session.user.id)))
      if (!icp) return c.json({ success: false, error: 'Not found' }, 404)
      return c.json({ success: true, icp })
    },
  )
  .post(
    '/icps',
    describeRoute({
      tags: ['Products'],
      summary: 'Create product',
      responses: { 200: { description: 'Created product' } },
    }),
    requireAuth,
    async (c) => {
      const session = c.get('session')
      const body = await c.req.json()

      const [icp] = await db
        .insert(icps)
        .values({
          userId: session.user.id,
          name: body.name,
          website: body.website || null,
          description: body.description || '',
          painPoints: body.painPoints || '',
          keywords: body.keywords || [],
          subreddits: body.subreddits || [],
        })
        .returning()

      if (icp.subreddits.length) {
        triggerInitialSeeding(icp.id).catch((e) => console.error('[ICP] Seeding error:', e))
      }

      return c.json({ success: true, icp })
    },
  )
  .put(
    '/icps/:id',
    describeRoute({
      tags: ['Products'],
      summary: 'Update product',
      responses: { 200: { description: 'Updated product' } },
    }),
    requireAuth,
    async (c) => {
      const session = c.get('session')
      const body = await c.req.json()

      const [existing] = await db
        .select()
        .from(icps)
        .where(and(eq(icps.id, c.req.param('id')), eq(icps.userId, session.user.id)))
      if (!existing) return c.json({ success: false, error: 'Not found' }, 404)

      const [updated] = await db
        .update(icps)
        .set({
          name: body.name ?? existing.name,
          website: body.website ?? existing.website,
          description: body.description ?? existing.description,
          painPoints: body.painPoints ?? existing.painPoints,
          keywords: body.keywords ?? existing.keywords,
          subreddits: body.subreddits ?? existing.subreddits,
          isActive: body.isActive ?? existing.isActive,
        })
        .where(eq(icps.id, existing.id))
        .returning()

      return c.json({ success: true, icp: updated })
    },
  )
  .delete(
    '/icps/:id',
    describeRoute({
      tags: ['Products'],
      summary: 'Delete product',
      responses: { 200: { description: 'Deleted' } },
    }),
    requireAuth,
    async (c) => {
      const session = c.get('session')
      const [existing] = await db
        .select()
        .from(icps)
        .where(and(eq(icps.id, c.req.param('id')), eq(icps.userId, session.user.id)))
      if (!existing) return c.json({ success: false, error: 'Not found' }, 404)

      await db.delete(icps).where(eq(icps.id, existing.id))
      return c.json({ success: true })
    },
  )
