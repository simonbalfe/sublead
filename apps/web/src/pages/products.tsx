import { api } from '@shared/lib/api'
import { Button } from '@ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Loader2, Plus, Trash2, Globe, Hash } from 'lucide-react'

export function ProductsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['icps'],
    queryFn: async () => {
      const res = await api.api.icps.$get()
      return res.json() as Promise<{ success: boolean; icps: any[] }>
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.api.icps[':id'].$delete({ param: { id } })
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['icps'] }),
  })

  const products = data?.icps ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-muted-foreground">Define your ideal customer profiles to monitor Reddit.</p>
        </div>
        <Link to="/products/new">
          <Button>
            <Plus className="size-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No products yet. Add one to start finding leads.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {products.map((p: any) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    {p.website && (
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Globe className="size-3" />
                        {p.website}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Delete this product and all its leads?')) {
                        deleteMutation.mutate(p.id)
                      }
                    }}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                {p.subreddits?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.subreddits.map((s: string) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs"
                      >
                        <Hash className="size-3" />
                        r/{s}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
