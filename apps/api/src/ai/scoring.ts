import { z } from 'zod'
import { weakScorer, strongScorer } from './agents'

const weakScoreSchema = z.object({
  product_fit: z.number().min(1).max(100),
  intent: z.number().min(1).max(100),
  authority: z.number().min(1).max(100),
  total: z.number().min(1).max(100),
})

const strongScoreSchema = z.object({
  product_fit: z.number().min(1).max(100),
  intent: z.number().min(1).max(100),
  authority: z.number().min(1).max(100),
  total: z.number().min(1).max(100),
  product_fit_justification: z.string(),
  intent_justification: z.string(),
  authority_justification: z.string(),
  pain_points: z.string(),
  overall_assessment: z.string(),
})

export type StrongScoreResult = z.infer<typeof strongScoreSchema>

function buildUserMessage(
  post: { title: string; selftext: string; subreddit: string },
  icp: { description: string; painPoints: string },
): string {
  return JSON.stringify({
    icp_description: icp.description,
    icp_pain_points: icp.painPoints,
    reddit_post_title: post.title,
    reddit_post_content: post.selftext.slice(0, 2000),
    subreddit: post.subreddit,
  })
}

export async function weakScore(
  post: { title: string; selftext: string; subreddit: string },
  icp: { description: string; painPoints: string },
): Promise<{ total: number } | null> {
  try {
    const res = await weakScorer.generate(buildUserMessage(post, icp), {
      structuredOutput: { schema: weakScoreSchema },
    })
    return res.object
  } catch {
    return null
  }
}

export async function strongScore(
  post: { title: string; selftext: string; subreddit: string },
  icp: { description: string; painPoints: string },
): Promise<StrongScoreResult | null> {
  try {
    const res = await strongScorer.generate(buildUserMessage(post, icp), {
      structuredOutput: { schema: strongScoreSchema },
    })
    return res.object
  } catch {
    return null
  }
}

export async function twoStageScore(
  post: { title: string; selftext: string; subreddit: string },
  icp: { description: string; painPoints: string },
  weakThreshold = 30,
): Promise<StrongScoreResult | null> {
  const weak = await weakScore(post, icp)
  if (!weak || weak.total <= weakThreshold) return null
  return strongScore(post, icp)
}
