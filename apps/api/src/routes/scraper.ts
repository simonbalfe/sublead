import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { requireAuth } from '../middleware/auth'
import { triggerScrape, triggerInitialSeeding, getScraperStatus } from '../services/scraper'
import { db } from '../db'
import { icps } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { checkRedditHealth } from '../services/python-client'

export const scraperRoutes = new Hono()
  .post(
    '/scraper/trigger',
    describeRoute({
      tags: ['Scraper'],
      summary: 'Trigger scrape cycle',
      responses: { 200: { description: 'Triggered' } },
    }),
    requireAuth,
    async (c) => {
      triggerScrape().catch((e) => console.error('[SCRAPER] Manual trigger error:', e))
      return c.json({ success: true, message: 'Scrape triggered' })
    },
  )
  .post(
    '/scraper/seed/:icpId',
    describeRoute({
      tags: ['Scraper'],
      summary: 'Trigger initial seeding',
      responses: { 200: { description: 'Triggered' } },
    }),
    requireAuth,
    async (c) => {
      const session = c.get('session')
      const icpId = c.req.param('icpId')
      const [icp] = await db
        .select()
        .from(icps)
        .where(and(eq(icps.id, icpId), eq(icps.userId, session.user.id)))
      if (!icp) return c.json({ success: false, error: 'Not found' }, 404)

      triggerInitialSeeding(icpId).catch((e) => console.error('[SCRAPER] Seeding error:', e))
      return c.json({ success: true, message: 'Seeding triggered' })
    },
  )
  .get(
    '/scraper/status',
    describeRoute({
      tags: ['Scraper'],
      summary: 'Scraper status',
      responses: { 200: { description: 'Status' } },
    }),
    requireAuth,
    async (c) => {
      const status = getScraperStatus()
      const redditHealthy = await checkRedditHealth()
      return c.json({ success: true, ...status, redditConnected: redditHealthy })
    },
  )
