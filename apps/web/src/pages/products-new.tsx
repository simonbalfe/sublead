import { api } from '@shared/lib/api'
import { Button } from '@ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Input } from '@ui/components/input'
import { Label } from '@ui/components/label'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Globe, Loader2, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type Step = 1 | 2 | 3 | 4

export function ProductNewPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')
  const [painPoints, setPainPoints] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [subreddits, setSubreddits] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [generatingKeywords, setGeneratingKeywords] = useState(false)
  const [discoveringSubreddits, setDiscoveringSubreddits] = useState(false)

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.api.icps.$post({
        json: { name, website, description, painPoints, keywords, subreddits },
      })
      return res.json()
    },
    onSuccess: () => {
      toast.success('Product created')
      navigate({ to: '/products' })
    },
    onError: () => toast.error('Failed to create product'),
  })

  const analyzeUrl = async () => {
    if (!website.trim()) return
    setAnalyzing(true)
    try {
      const res = await api.api.ai['analyze-url'].$post({ json: { url: website } })
      const data = (await res.json()) as any
      if (data.success) {
        setDescription(data.icpDescription)
        setPainPoints(data.painPoints)
        toast.success('Website analyzed')
      }
    } catch {
      toast.error('Failed to analyze URL')
    } finally {
      setAnalyzing(false)
    }
  }

  const generateKeywords = async () => {
    setGeneratingKeywords(true)
    try {
      const res = await api.api.ai['generate-keywords'].$post({
        json: { description, icpDescription: description, painPoints },
      })
      const data = (await res.json()) as any
      if (data.success) {
        setKeywords(data.keywords)
        toast.success('Keywords generated')
      }
    } catch {
      toast.error('Failed to generate keywords')
    } finally {
      setGeneratingKeywords(false)
    }
  }

  const discoverSubreddits = async () => {
    setDiscoveringSubreddits(true)
    try {
      const res = await api.api.ai['discover-subreddits'].$post({
        json: { keywords, description },
      })
      const data = (await res.json()) as any
      if (data.success) {
        setSuggestions(data.subreddits)
        setSubreddits(data.subreddits.slice(0, 5))
        toast.success('Subreddits discovered')
      }
    } catch {
      toast.error('Failed to discover subreddits')
    } finally {
      setDiscoveringSubreddits(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/products' })}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">New Product</h1>
          <p className="text-sm text-muted-foreground">Step {step} of 4</p>
        </div>
      </div>

      <div className="flex gap-1">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Business Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My SaaS" />
            </div>
            <div className="space-y-2">
              <Label>Website URL (optional)</Label>
              <div className="flex gap-2">
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
                <Button variant="outline" onClick={analyzeUrl} disabled={analyzing || !website.trim()}>
                  {analyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Analyze
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs min-h-24 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does your product do? Who is it for?"
              />
            </div>
            <Button onClick={() => setStep(2)} disabled={!name.trim()} className="w-full">
              Next <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Pain Points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>What problems does your product solve?</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs min-h-32 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
                placeholder="Describe the specific pain points your customers face..."
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button
                onClick={async () => {
                  await generateKeywords()
                  setStep(3)
                }}
                disabled={generatingKeywords}
                className="flex-1"
              >
                {generatingKeywords ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    Generate Keywords <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Keywords</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs cursor-pointer hover:bg-destructive/10"
                  onClick={() => setKeywords(keywords.filter((_, j) => j !== i))}
                >
                  {kw}
                  <X className="size-3" />
                </span>
              ))}
            </div>
            {keywords.length === 0 && (
              <p className="text-sm text-muted-foreground">No keywords generated yet.</p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button
                onClick={async () => {
                  await discoverSubreddits()
                  setStep(4)
                }}
                disabled={discoveringSubreddits || keywords.length === 0}
                className="flex-1"
              >
                {discoveringSubreddits ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    Find Subreddits <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Target Subreddits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Select up to 5 subreddits to monitor.</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    if (subreddits.includes(s)) {
                      setSubreddits(subreddits.filter((x) => x !== s))
                    } else if (subreddits.length < 5) {
                      setSubreddits([...subreddits, s])
                    }
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
                    subreddits.includes(s)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-input hover:bg-accent'
                  }`}
                >
                  r/{s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || subreddits.length === 0}
                className="flex-1"
              >
                {createMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Create Product'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
