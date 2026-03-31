import { RootRoute, Route, Router } from '@tanstack/react-router'
import RootLayout from './pages/RootLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import CheckoutPage from './pages/checkout/CheckoutPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import ScoresPage from './pages/scores/ScoresPage'
import WinningsPage from './pages/winnings/WinningsPage'
import CharitySelectionPage from './pages/charity/CharitySelectionPage'
import CharitiesPage from './pages/charities/CharitiesPage'
import CharityDetailPage from './pages/charities/CharityDetailPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import UserManagementPage from './pages/admin/UserManagementPage'
import DrawManagementPage from './pages/admin/DrawManagementPage'
import CharityManagementPage from './pages/admin/CharityManagementPage'
import WinnersPage from './pages/admin/WinnersPage'
import ReportsPage from './pages/admin/ReportsPage'
import NotFoundPage from './pages/NotFoundPage'

import { AuthGuard } from './components/auth/AuthGuard'
import { AdminGuard } from './components/auth/AdminGuard'

const rootRoute = new RootRoute({
  component: RootLayout,
})

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
})

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/auth/login',
  component: LoginPage,
})

const signupRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/auth/signup',
  component: SignupPage,
})

const checkoutRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  component: CheckoutPage,
})

const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => <AuthGuard><DashboardPage /></AuthGuard>,
})

const profileRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: () => <AuthGuard><ProfilePage /></AuthGuard>,
})

const scoresRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/scores',
  component: () => <AuthGuard><ScoresPage /></AuthGuard>,
})

const winningsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/winnings',
  component: () => <AuthGuard><WinningsPage /></AuthGuard>,
})

const charitySelectionRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/charity',
  component: () => <AuthGuard><CharitySelectionPage /></AuthGuard>,
})

const charitiesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/charities',
  component: CharitiesPage,
})

const charityDetailRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/charities/$charityId',
  component: CharityDetailPage,
})

const adminRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: () => <AdminGuard><AdminDashboardPage /></AdminGuard>,
})

const adminUsersRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/admin/users',
  component: () => <AdminGuard><UserManagementPage /></AdminGuard>,
})

const adminDrawsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/admin/draws',
  component: () => <AdminGuard><DrawManagementPage /></AdminGuard>,
})

const adminCharitiesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/admin/charities',
  component: () => <AdminGuard><CharityManagementPage /></AdminGuard>,
})

const adminWinnersRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/admin/winners',
  component: () => <AdminGuard><WinnersPage /></AdminGuard>,
})

const adminReportsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/admin/reports',
  component: () => <AdminGuard><ReportsPage /></AdminGuard>,
})

const notFoundRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFoundPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  checkoutRoute,
  dashboardRoute,
  profileRoute,
  scoresRoute,
  winningsRoute,
  charitySelectionRoute,
  charitiesRoute,
  charityDetailRoute,
  adminRoute,
  adminUsersRoute,
  adminDrawsRoute,
  adminCharitiesRoute,
  adminWinnersRoute,
  adminReportsRoute,
  notFoundRoute,
])

export const router = new Router({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
