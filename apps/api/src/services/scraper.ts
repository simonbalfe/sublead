import { db } from '../db'
import { icps, processedPosts, redditPosts, usageTracking } from '../db/schema'
import { eq, and, inArray, sql } from 'drizzle-orm'
import { config } from '../config'
import { fetchNewPosts, fetchHotPosts } from './python-client'
import type { RedditPostData } from './python-client'
import { checkSimilarity } from '../ai/embeddings'
import { twoStageScore } from '../ai/scoring'
import type { StrongScoreResult } from '../ai/scoring'

let nextScrapeTime: Date | null = null
let isRunning = false
let intervalId: ReturnType<typeof setInterval> | null = null

const INTERVAL_MS = 30 * 60 * 1000

export function startScraper() {
  nextScrapeTime = new Date(Date.now() + INTERVAL_MS)
  intervalId = setInterval(() => {
    triggerScrape().catch((e) => console.error('[SCRAPER] Error:', e))
  }, INTERVAL_MS)
  console.log('[SCRAPER] Started, next run in 30 minutes')
}

export function getScraperStatus() {
  return { nextScrapeTime: nextScrapeTime?.toISOString() ?? null, isRunning }
}

export async function triggerScrape(): Promise<void> {
  if (isRunning) return
  isRunning = true
  console.log('[SCRAPER] Starting collection cycle')

  try {
    const allIcps = await db.select().from(icps).where(eq(icps.isActive, true))
    for (const icp of allIcps) {
      if (!icp.subreddits.length) continue
      for (const subreddit of icp.subreddits) {
        try {
          await processSubreddit(icp, subreddit, 'new')
        } catch (e) {
          console.error(`[SCRAPER] Error processing r/${subreddit} for ICP ${icp.id}:`, e)
        }
      }
    }
  } finally {
    isRunning = false
    nextScrapeTime = new Date(Date.now() + INTERVAL_MS)
    console.log('[SCRAPER] Collection cycle complete')
  }
}

export async function triggerInitialSeeding(icpId: string): Promise<void> {
  const [icp] = await db.select().from(icps).where(eq(icps.id, icpId))
  if (!icp) return

  console.log(`[SCRAPER] Initial seeding for ICP ${icpId}`)
  for (const subreddit of icp.subreddits) {
    try {
      await processSubreddit(icp, subreddit, 'hot')
    } catch (e) {
      console.error(`[SCRAPER] Seeding error r/${subreddit}:`, e)
    }
  }

  await db.update(icps).set({ seeded: true }).where(eq(icps.id, icpId))
  console.log(`[SCRAPER] Seeding complete for ICP ${icpId}`)
}

type IcpRow = typeof icps.$inferSelect

async function processSubreddit(icp: IcpRow, subreddit: string, mode: 'new' | 'hot') {
  const posts = mode === 'new' ? await fetchNewPosts(subreddit, 50) : await fetchHotPosts(subreddit, 'month', 50)

  if (!posts.length) return

  const redditIds = posts.map((p) => p.id)
  const existing = await db
    .select({ redditId: processedPosts.redditId })
    .from(processedPosts)
    .where(and(eq(processedPosts.icpId, icp.id), inArray(processedPosts.redditId, redditIds)))

  const existingSet = new Set(existing.map((r) => r.redditId))
  const newPosts = posts.filter((p) => !existingSet.has(p.id))

  if (!newPosts.length) return

  await db
    .insert(processedPosts)
    .values(newPosts.map((p) => ({ icpId: icp.id, redditId: p.id })))
    .onConflictDoNothing()

  const icpText = `${icp.description}\n${icp.painPoints}`

  for (const post of newPosts) {
    try {
      await processPost(post, icp, icpText)
    } catch (e) {
      console.error(`[SCRAPER] Error scoring post ${post.id}:`, e)
    }
  }
}

async function processPost(post: RedditPostData, icp: IcpRow, icpText: string) {
  const postText = `${post.title}\n${post.selftext}`.slice(0, 2000)
  if (!postText.trim()) return

  const { passes, score: simScore } = await checkSimilarity(postText, icpText)
  if (!passes) {
    console.log(`[SCRAPER] Embedding filter: ${post.id} (${(simScore * 100).toFixed(1)}%) SKIP`)
    return
  }

  const result = await twoStageScore(
    { title: post.title, selftext: post.selftext, subreddit: post.subreddit },
    { description: icp.description, painPoints: icp.painPoints },
  )

  if (!result || result.total <= 30) return

  await insertLead(post, icp, result)
  await incrementQualifiedLeads(icp.userId)
  console.log(`[SCRAPER] Lead saved: ${post.id} score=${result.total}`)
}

async function insertLead(post: RedditPostData, icp: IcpRow, score: StrongScoreResult) {
  await db
    .insert(redditPosts)
    .values({
      icpId: icp.id,
      userId: icp.userId,
      redditId: post.id,
      title: post.title,
      selftext: post.selftext,
      url: post.url,
      subreddit: post.subreddit,
      author: post.author,
      redditCreatedAt: new Date(post.created_utc * 1000),
      productFitScore: score.product_fit,
      intentScore: score.intent,
      authorityScore: score.authority,
      totalScore: score.total,
      productFitJustification: score.product_fit_justification,
      intentJustification: score.intent_justification,
      authorityJustification: score.authority_justification,
      painPoints: score.pain_points,
      overallAssessment: score.overall_assessment,
    })
    .onConflictDoNothing()
}

async function incrementQualifiedLeads(userId: string) {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  await db
    .insert(usageTracking)
    .values({ userId, month, year, qualifiedLeads: 1 })
    .onConflictDoNothing()

  await db
    .update(usageTracking)
    .set({ qualifiedLeads: sql`${usageTracking.qualifiedLeads} + 1` })
    .where(
      and(eq(usageTracking.userId, userId), eq(usageTracking.month, month), eq(usageTracking.year, year)),
    )
}
