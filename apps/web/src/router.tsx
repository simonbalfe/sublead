import {
  Navigate,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { AuthGuard } from '@shared/components/auth-guard'
import { DashboardLayout } from '@shared/components/layout/dashboard-layout'
import { AuthPage } from '@/pages/auth'
import { DashboardPage } from '@/pages/dashboard'
import { SettingsPage } from '@/pages/settings'
import { ProductsPage } from '@/pages/products'
import { ProductNewPage } from '@/pages/products-new'
import { LeadsPage } from '@/pages/leads'
import { LeadDetailPage } from '@/pages/lead-detail'

const rootRoute = createRootRoute({
  component: Outlet,
})

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: AuthPage,
})

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  component: () => (
    <AuthGuard>
      <DashboardLayout />
    </AuthGuard>
  ),
})

const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/dashboard',
  component: DashboardPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/settings',
  component: SettingsPage,
})

const productsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/products',
  component: ProductsPage,
})

const productNewRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/products/new',
  component: ProductNewPage,
})

const leadsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/leads',
  component: LeadsPage,
})

const leadDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/leads/$id',
  component: LeadDetailPage,
})

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$',
  component: () => <Navigate to="/dashboard" />,
})

const routeTree = rootRoute.addChildren([
  authRoute,
  authenticatedRoute.addChildren([
    dashboardRoute,
    settingsRoute,
    productsRoute,
    productNewRoute,
    leadsRoute,
    leadDetailRoute,
  ]),
  catchAllRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
