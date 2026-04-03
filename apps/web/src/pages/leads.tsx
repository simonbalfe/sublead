import { api } from '@shared/lib/api'
import { Button } from '@ui/components/button'
import { Card, CardContent } from '@ui/components/card'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Bot, Check, ExternalLink, Eye, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

function scoreBadge(score: number) {
  const color =
    score > 75 ? 'bg-green-100 text-green-700' :
    score > 50 ? 'bg-lime-100 text-lime-700' :
    score > 25 ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700'
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{score}%</span>
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    seen: 'bg-secondary text-muted-foreground',
    replied: 'bg-green-100 text-green-700',
    dismissed: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.new}`}>
      {status}
    </span>
  )
}

export function LeadsPage() {
  const queryClient = useQueryClient()
  const [filterIcpId, setFilterIcpId] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replies, setReplies] = useState<Record<string, string>>({})

  const { data: icpsData } = useQuery({
    queryKey: ['icps'],
    queryFn: async () => {
      const res = await api.api.icps.$get()
      return res.json() as Promise<{ success: boolean; icps: any[] }>
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['leads', filterIcpId, filterStatus],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (filterIcpId) params.icpId = filterIcpId
      if (filterStatus) params.status = filterStatus
      const query = new URLSearchParams(params).toString()
      const res = await fetch(`/api/leads?${query}`, { credentials: 'include' })
      return res.json() as Promise<{ success: boolean; leads: any[] }>
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.api.leads[':id'].status.$post({ param: { id }, json: { status } })
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  })

  const generateReply = async (leadId: string) => {
    setReplyingId(leadId)
    try {
      const res = await api.api.ai['generate-reply'].$post({ json: { leadId } })
      const data = (await res.json()) as any
      if (data.success) {
        setReplies((prev) => ({ ...prev, [leadId]: data.reply }))
        toast.success('Reply generated')
      }
    } catch {
      toast.error('Failed to generate reply')
    } finally {
      setReplyingId(null)
    }
  }

  const leads = data?.leads ?? []
  const icpsList = icpsData?.icps ?? []

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-semibold">Leads</h1>

      <div className="flex gap-2">
        <select
          value={filterIcpId}
          onChange={(e) => setFilterIcpId(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All Products</option>
          {icpsList.map((icp: any) => (
            <option key={icp.id} value={icp.id}>{icp.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="seen">Seen</option>
          <option value="replied">Replied</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No leads found. Create a product to start scanning Reddit.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {leads.map((lead: any) => (
            <Card key={lead.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">r/{lead.subreddit}</span>
                      {scoreBadge(lead.totalScore)}
                      {statusBadge(lead.status)}
                    </div>
                    <Link
                      to="/leads/$id"
                      params={{ id: lead.id }}
                      className="text-sm font-medium hover:underline line-clamp-1"
                    >
                      {lead.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{lead.selftext}</p>

                    {replies[lead.id] && (
                      <div className="mt-3 rounded-md bg-muted p-3">
                        <p className="text-sm">{replies[lead.id]}</p>
                        <a
                          href={lead.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          onClick={() => {
                            navigator.clipboard.writeText(replies[lead.id])
                            toast.success('Reply copied')
                          }}
                        >
                          Copy & Go to Reddit <ExternalLink className="size-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {lead.status === 'new' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => statusMutation.mutate({ id: lead.id, status: 'seen' })}
                        title="Mark seen"
                      >
                        <Eye className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => generateReply(lead.id)}
                      disabled={replyingId === lead.id}
                      title="Generate reply"
                    >
                      {replyingId === lead.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Bot className="size-4" />
                      )}
                    </Button>
                    <a href={lead.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" title="Open on Reddit">
                        <ExternalLink className="size-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
