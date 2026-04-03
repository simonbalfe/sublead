export async function fetchAndParseHtml(url: string): Promise<string> {
  let target = url.trim()
  if (!target.startsWith('http')) target = `https://${target}`

  const res = await fetch(target, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) throw new Error(`Failed to fetch ${target}: HTTP ${res.status}`)

  const html = await res.text()
  return extractText(html)
}

function extractText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? ''
  const metaDesc =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1]?.trim() ?? ''

  const headings: string[] = []
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi
  let match: RegExpExecArray | null = headingRegex.exec(text)
  while (match) {
    const h = match[1].replace(/<[^>]+>/g, '').trim()
    if (h) headings.push(h)
    match = headingRegex.exec(text)
  }

  const body = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

  const parts: string[] = []
  if (title) parts.push(`Title: ${title}`)
  if (metaDesc) parts.push(`Description: ${metaDesc}`)
  if (headings.length) parts.push(`Headings: ${headings.slice(0, 10).join(' | ')}`)
  if (body) parts.push(`Content: ${body.slice(0, 3000)}`)

  return parts.join('\n\n')
}
