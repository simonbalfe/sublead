import OpenAI from 'openai'
import { config } from '../config'

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY })

export async function getEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  })
  return res.data[0].embedding
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function checkSimilarity(
  postText: string,
  icpDescription: string,
  threshold = 0.25,
): Promise<{ passes: boolean; score: number }> {
  const [postEmb, icpEmb] = await Promise.all([getEmbedding(postText), getEmbedding(icpDescription)])
  const score = cosineSimilarity(postEmb, icpEmb)
  return { passes: score >= threshold, score }
}
