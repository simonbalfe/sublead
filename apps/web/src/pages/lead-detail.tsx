import { api } from '@shared/lib/api'
import { Button } from '@ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Bot, ExternalLink, Loader2, Target, Zap, UserCheck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

function ScoreBar({ label, score, icon: Icon }: { label: string; score: number; icon: any }) {
  const color =
    score > 75 ? 'bg-green-500' :
    score > 50 ? 'bg-lime-500' :
    score > 25 ? 'bg-amber-500' :
    'bg-red-500'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </span>
        <span className="font-semibold">{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export function LeadDetailPage() {
  const { id } = useParams({ from: '/leads/$id' as any })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [generatingReply, setGeneratingReply] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const res = await api.api.leads[':id'].$get({ param: { id } })
      return res.json() as Promise<{ success: boolean; lead: any }>
    },
  })

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await api.api.leads[':id'].status.$post({ param: { id }, json: { status } })
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead', id] }),
  })

  const generateReply = async () => {
    setGeneratingReply(true)
    try {
      const res = await api.api.ai['generate-reply'].$post({ json: { leadId: id } })
      const data = (await res.json()) as any
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['lead', id] })
        toast.success('Reply generated')
      }
    } catch {
      toast.error('Failed to generate reply')
    } finally {
      setGeneratingReply(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const lead = data?.lead
  if (!lead) return <p className="text-muted-foreground">Lead not found.</p>

  const totalColor =
    lead.totalScore > 75 ? 'text-green-600' :
    lead.totalScore > 50 ? 'text-lime-600' :
    lead.totalScore > 25 ? 'text-amber-600' :
    'text-red-600'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/leads' })}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold line-clamp-1">{lead.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>r/{lead.subreddit}</span>
            <span>by u/{lead.author}</span>
          </div>
        </div>
        <a href={lead.url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="size-4" /> Reddit
          </Button>
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post Content</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{lead.selftext || 'No text content.'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Lead Score
            <span className={`text-3xl font-bold ${totalColor}`}>{lead.totalScore}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScoreBar label="Product Fit" score={lead.productFitScore} icon={Target} />
          {lead.productFitJustification && (
            <p className="text-xs text-muted-foreground pl-5">{lead.productFitJustification}</p>
          )}
          <ScoreBar label="Intent" score={lead.intentScore} icon={Zap} />
          {lead.intentJustification && (
            <p className="text-xs text-muted-foreground pl-5">{lead.intentJustification}</p>
          )}
          <ScoreBar label="Authority" score={lead.authorityScore} icon={UserCheck} />
          {lead.authorityJustification && (
            <p className="text-xs text-muted-foreground pl-5">{lead.authorityJustification}</p>
          )}
        </CardContent>
      </Card>

      {lead.overallAssessment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{lead.overallAssessment}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reply</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lead.generatedReply ? (
            <>
              <p className="text-sm whitespace-pre-wrap">{lead.generatedReply}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(lead.generatedReply)
                    toast.success('Copied')
                  }}
                >
                  Copy
                </Button>
                <a href={lead.url} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(lead.generatedReply)
                      statusMutation.mutate('replied')
                    }}
                  >
                    Copy & Go to Reddit <ExternalLink className="size-3" />
                  </Button>
                </a>
              </div>
            </>
          ) : (
            <Button onClick={generateReply} disabled={generatingReply}>
              {generatingReply ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
              Generate Reply
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {lead.status === 'new' && (
          <Button variant="outline" onClick={() => statusMutation.mutate('seen')}>
            Mark Seen
          </Button>
        )}
        {lead.status !== 'dismissed' && (
          <Button variant="outline" onClick={() => statusMutation.mutate('dismissed')}>
            Dismiss
          </Button>
        )}
      </div>
    </div>
  )
}
