import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { icpAnalyzer, keywordGenerator, subredditFilter, replyGenerator } from '../ai/agents'
import { fetchAndParseHtml } from '../services/html-parser'
import { searchSubreddits } from '../services/python-client'
import { db } from '../db'
import { redditPosts, icps } from '../db/schema'
import { eq, and } from 'drizzle-orm'

const analyzeUrlOutputSchema = z.object({
  icp_description: z.string(),
  pain_points: z.string(),
})

const keywordsOutputSchema = z.object({
  keywords: z.array(z.string()),
})

const subredditOutputSchema = z.object({
  relevant_subreddits: z.array(z.string()),
})

const replyOutputSchema = z.object({
  reply: z.string(),
})

export const aiRoutes = new Hono()
  .post(
    '/ai/analyze-url',
    describeRoute({
      tags: ['AI'],
      summary: 'Analyze business URL',
      responses: { 200: { description: 'ICP analysis' } },
    }),
    requireAuth,
    async (c) => {
      const body = await c.req.json()
      if (!body.url) return c.json({ success: false, error: 'URL is required' }, 400)

      try {
        const parsed = await fetchAndParseHtml(body.url)
        const res = await icpAnalyzer.generate(parsed, {
          structuredOutput: { schema: analyzeUrlOutputSchema },
        })
        return c.json({
          success: true,
          icpDescription: res.object.icp_description,
          painPoints: res.object.pain_points,
        })
      } catch (e) {
        return c.json({ success: false, error: `Analysis failed: ${e}` }, 500)
      }
    },
  )
  .post(
    '/ai/generate-keywords',
    describeRoute({
      tags: ['AI'],
      summary: 'Generate search keywords',
      responses: { 200: { description: 'Keywords' } },
    }),
    requireAuth,
    async (c) => {
      const body = await c.req.json()
      const prompt = JSON.stringify({
        description: body.description || '',
        icp_description: body.icpDescription || '',
        pain_points: body.painPoints || '',
      })

      try {
        const res = await keywordGenerator.generate(prompt, {
          structuredOutput: { schema: keywordsOutputSchema },
        })
        return c.json({ success: true, keywords: res.object.keywords })
      } catch (e) {
        return c.json({ success: false, error: `Keyword generation failed: ${e}` }, 500)
      }
    },
  )
  .post(
    '/ai/discover-subreddits',
    describeRoute({
      tags: ['AI'],
      summary: 'Discover relevant subreddits',
      responses: { 200: { description: 'Subreddits' } },
    }),
    requireAuth,
    async (c) => {
      const body = await c.req.json()
      const keywords: string[] = body.keywords || []

      if (!keywords.length) {
        return c.json({ success: false, error: 'Keywords required' }, 400)
      }

      try {
        const candidates = await searchSubreddits(keywords)
        const prompt = JSON.stringify({
          business_description: body.description || '',
          subreddits: candidates.map((s) => ({
            name: s.name,
            description: s.description,
            subscribers: s.subscribers,
          })),
        })

        const res = await subredditFilter.generate(prompt, {
          structuredOutput: { schema: subredditOutputSchema },
        })

        return c.json({ success: true, subreddits: res.object.relevant_subreddits })
      } catch (e) {
        return c.json({ success: false, error: `Discovery failed: ${e}` }, 500)
      }
    },
  )
  .post(
    '/ai/generate-reply',
    describeRoute({
      tags: ['AI'],
      summary: 'Generate Reddit reply',
      responses: { 200: { description: 'Reply' } },
    }),
    requireAuth,
    async (c) => {
      const session = c.get('session')
      const body = await c.req.json()

      const [lead] = await db
        .select()
        .from(redditPosts)
        .where(and(eq(redditPosts.id, body.leadId), eq(redditPosts.userId, session.user.id)))
      if (!lead) return c.json({ success: false, error: 'Lead not found' }, 404)

      const [icp] = await db.select().from(icps).where(eq(icps.id, lead.icpId))
      if (!icp) return c.json({ success: false, error: 'Product not found' }, 404)

      try {
        const prompt = JSON.stringify({
          reddit_post: `${lead.title}\n\n${lead.selftext}`,
          subreddit: lead.subreddit,
          product_name: icp.name,
          product_description: icp.description,
        })

        const res = await replyGenerator.generate(prompt, {
          structuredOutput: { schema: replyOutputSchema },
        })

        await db.update(redditPosts).set({ generatedReply: res.object.reply }).where(eq(redditPosts.id, lead.id))

        return c.json({ success: true, reply: res.object.reply })
      } catch (e) {
        return c.json({ success: false, error: `Reply generation failed: ${e}` }, 500)
      }
    },
  )
