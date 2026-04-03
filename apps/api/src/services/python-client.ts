import { config } from '../config'

const BASE = config.PYTHON_SERVICE_URL

interface SubredditInfo {
  name: string
  subscribers: number
  description: string
}

export interface RedditPostData {
  id: string
  title: string
  selftext: string
  url: string
  created_utc: number
  author: string
  subreddit: string
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`Python service ${path}: ${res.status}`)
  return res.json() as Promise<T>
}

export async function searchSubreddits(keywords: string[]): Promise<SubredditInfo[]> {
  const data = await post<{ subreddits: SubredditInfo[] }>('/reddit/search-subreddits', { keywords })
  return data.subreddits
}

export async function fetchNewPosts(subreddit: string, limit = 50): Promise<RedditPostData[]> {
  const data = await post<{ posts: RedditPostData[] }>('/reddit/fetch-new-posts', { subreddit, limit })
  return data.posts
}

export async function fetchHotPosts(
  subreddit: string,
  timeFilter = 'month',
  limit = 50,
): Promise<RedditPostData[]> {
  const data = await post<{ posts: RedditPostData[] }>('/reddit/fetch-hot-posts', {
    subreddit,
    time_filter: timeFilter,
    limit,
  })
  return data.posts
}

export async function checkRedditHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(5_000) })
    return res.ok
  } catch {
    return false
  }
}
