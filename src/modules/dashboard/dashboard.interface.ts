export type DashboardOverview = {
  totalUsers: number
  newUsersThisMonth: number
  totalRevenue: number
  revenueThisMonth: number
  revenueLastMonth: number
  revenueChangePercent: number
  shopRevenue: number
  subscriptionRevenue: number
  totalOrders: number
  totalRefunds: number
  activeSubscriptions: number
  trialingSubscriptions: number
  canceledSubscriptions: number
  mrr: number
}

export type MonthlyPoint = {
  month: string
  monthIndex: number
  value: number
}

export type MonthlyRevenueByType = {
  month: string
  monthIndex: number
  shop: number
  subscription: number
  total: number
}

export type PlanLeaderboardItem = {
  planId: string
  name: string
  activeSubscribers: number
  totalRevenue: number
}

export type RecentActivityItem = {
  type: 'USER' | 'ORDER' | 'SUBSCRIPTION' | 'REFUND'
  id: string
  at: Date
  label: string
  amount?: number
  meta?: Record<string, unknown>
}
