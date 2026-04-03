import { useUser } from '@shared/hooks/use-user'
import { api } from '@shared/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Loader2, Target, Package, TrendingUp } from 'lucide-react'

export function DashboardPage() {
  const { user } = useUser()

  const { data, isLoading } = useQuery({
    queryKey: ['lead-stats'],
    queryFn: async () => {
      const res = await api.api.leads.stats.$get()
      return res.json() as Promise<{
        success: boolean
        stats: {
          totalLeads: number
          avgScore: number
          activeProducts: number
          distribution: Record<string, number>
        }
      }>
    },
  })

  const stats = data?.stats

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground">Your lead generation overview.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Target className="size-4" />
                  Total Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats?.totalLeads ?? 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Package className="size-4" />
                  Active Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats?.activeProducts ?? 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <TrendingUp className="size-4" />
                  Avg Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats?.avgScore ?? 0}%</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quality Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { key: 'ready', label: 'Ready (76-100)', color: 'bg-green-500' },
                  { key: 'strong', label: 'Strong (51-75)', color: 'bg-lime-500' },
                  { key: 'moderate', label: 'Moderate (26-50)', color: 'bg-amber-500' },
                  { key: 'low', label: 'Low (0-25)', color: 'bg-red-500' },
                ].map(({ key, label, color }) => {
                  const count = stats?.distribution?.[key] ?? 0
                  const total = stats?.totalLeads || 1
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-32 text-sm text-muted-foreground">{label}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-sm font-medium">{count}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Link
              to="/products"
              className="text-sm text-primary hover:underline"
            >
              Manage Products
            </Link>
            <Link
              to="/leads"
              className="text-sm text-primary hover:underline"
            >
              View All Leads
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
