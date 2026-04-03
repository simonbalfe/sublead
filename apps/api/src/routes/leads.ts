import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { db } from '../db'
import { redditPosts, icps } from '../db/schema'
import { eq, and, desc, count, avg, sql } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'

export const leadRoutes = new Hono()
  .get(
    '/leads',
    describeRoute({
      tags: ['Leads'],
      summary: 'List leads',
      responses: { 200: { description: 'Paginated leads' } },
    }),
    requireAuth,
    async (c) => {
      const session = c.get('session')
      const icpId = c.req.query('icpId')
      const status = c.req.query('status')

      const conditions = [eq(redditPosts.userId, session.user.id)]
      if (icpId) conditions.push(eq(redditPosts.icpId, icpId))
      if (status) conditions.push(eq(redditPosts.status, status))

      const rows = await db
        .select()
        .from(redditPosts)
        .where(and(...conditions))
        .orderBy(desc(redditPosts.totalScore))
        .limit(200)

      return c.json({ success: true, leads: rows })
    },
  )
  .get(
    '/leads/stats',
    describeRoute({
      tags: ['Leads'],
      summary: 'Lead statistics',
      responses: { 200: { description: 'Stats' } },
    }),
    requireAuth,
    async (c) => {
      const session = c.get('session')
      const userId = session.user.id

      const [totalRow] = await db
        .select({ count: count() })
        .from(redditPosts)
        .where(eq(redditPosts.userId, userId))

      const [avgRow] = await db
        .select({ avg: avg(redditPosts.totalScore) })
        .from(redditPosts)
        .where(eq(redditPosts.userId, userId))

      const [icpCount] = await db
        .select({ count: count() })
        .from(icps)
        .where(eq(icps.userId, userId))

      const distribution = await db
        .select({
          bucket: sql<string>`CASE
            WHEN ${redditPosts.totalScore} <= 25 THEN 'low'
            WHEN ${redditPosts.totalScore} <= 50 THEN 'moderate'
            WHEN ${redditPosts.totalScore} <= 75 THEN 'strong'
            ELSE 'ready'
          END`,
          count: count(),
        })
        .from(redditPosts)
        .where(eq(redditPosts.userId, userId))
        .groupBy(sql`1`)

      return c.json({
        success: true,
        stats: {
          totalLeads: totalRow.count,
          avgScore: Math.round(Number(avgRow.avg) || 0),
          activeProducts: icpCount.count,
          distribution: Object.fromEntries(distribution.map((d) => [d.bucket, d.count])),
        },
      })
    },
  )
  .get(
    '/leads/:id',
    describeRoute({
      tags: ['Leads'],
      summary: 'Lead detail',
      responses: { 200: { description: 'Lead' } },
    }),
    requireAuth,
    async (c) => {
      const session = c.get('session')
      const [lead] = await db
        .select()
        .from(redditPosts)
        .where(and(eq(redditPosts.id, c.req.param('id')), eq(redditPosts.userId, session.user.id)))
      if (!lead) return c.json({ success: false, error: 'Not found' }, 404)
      return c.json({ success: true, lead })
    },
  )
  .post(
    '/leads/:id/status',
    describeRoute({
      tags: ['Leads'],
      summary: 'Update lead status',
      responses: { 200: { description: 'Updated' } },
    }),
    requireAuth,
    async (c) => {
      const session = c.get('session')
      const body = await c.req.json()
      const validStatuses = ['new', 'seen', 'replied', 'dismissed']
      if (!validStatuses.includes(body.status)) {
        return c.json({ success: false, error: 'Invalid status' }, 400)
      }

      const [updated] = await db
        .update(redditPosts)
        .set({ status: body.status })
        .where(and(eq(redditPosts.id, c.req.param('id')), eq(redditPosts.userId, session.user.id)))
        .returning()

      if (!updated) return c.json({ success: false, error: 'Not found' }, 404)
      return c.json({ success: true, lead: updated })
    },
  )
