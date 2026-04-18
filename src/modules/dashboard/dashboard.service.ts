import { Prisma } from '@prisma/client'
import prisma from '../../lib/prisma'
import {
  DashboardOverview,
  MonthlyPoint,
  MonthlyRevenueByType,
  PlanLeaderboardItem,
  RecentActivityItem,
} from './dashboard.interface'

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)

const firstOfPrevMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() - 1, 1)

// ---------- OVERVIEW ----------

const getOverview = async (): Promise<DashboardOverview> => {
  const now = new Date()
  const currentMonthStart = startOfMonth(now)
  const lastMonthStart = firstOfPrevMonth(now)

  const [
    totalUsers,
    newUsersThisMonth,
    allSuccessPayments,
    shopSuccessPayments,
    subSuccessPayments,
    thisMonthPayments,
    lastMonthPayments,
    totalOrders,
    totalRefunds,
    activeSubs,
    trialingSubs,
    canceledSubs,
    mrrAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: currentMonthStart } } }),
    prisma.paymentTransaction.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { amount: true },
    }),
    prisma.paymentTransaction.aggregate({
      where: { status: 'SUCCEEDED', type: 'SHOP' },
      _sum: { amount: true },
    }),
    prisma.paymentTransaction.aggregate({
      where: { status: 'SUCCEEDED', type: 'SUBSCRIPTION' },
      _sum: { amount: true },
    }),
    prisma.paymentTransaction.aggregate({
      where: { status: 'SUCCEEDED', createdAt: { gte: currentMonthStart } },
      _sum: { amount: true },
    }),
    prisma.paymentTransaction.aggregate({
      where: {
        status: 'SUCCEEDED',
        createdAt: { gte: lastMonthStart, lt: currentMonthStart },
      },
      _sum: { amount: true },
    }),
    prisma.shopOrder.count({ where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } } }),
    prisma.subscriptionRefund.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { refundedAmount: true },
    }),
    prisma.userSubscription.count({
      where: { status: 'ACTIVE', deletedAt: null },
    }),
    prisma.userSubscription.count({
      where: { status: 'TRIALING', deletedAt: null },
    }),
    prisma.userSubscription.count({
      where: { status: 'CANCELED', deletedAt: null },
    }),
    // MRR: active/trialing subs, plan price normalized to monthly
    prisma.userSubscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'TRIALING'] },
        deletedAt: null,
      },
      select: {
        plan: {
          select: { price: true, interval: true, intervalCount: true },
        },
      },
    }),
  ])

  const toMonthly = (price: number, interval: string, intervalCount: number) => {
    const perUnit = price / (intervalCount || 1)
    switch (interval) {
      case 'WEEKLY':
        return perUnit * (52 / 12)
      case 'YEARLY':
        return perUnit / 12
      case 'MONTHLY':
      default:
        return perUnit
    }
  }

  const mrr = mrrAgg.reduce((acc, s) => {
    const price = Number(s.plan.price)
    return acc + toMonthly(price, s.plan.interval, s.plan.intervalCount)
  }, 0)

  const totalRevenue = Number(allSuccessPayments._sum.amount ?? 0)
  const shopRevenue = Number(shopSuccessPayments._sum.amount ?? 0)
  const subscriptionRevenue = Number(subSuccessPayments._sum.amount ?? 0)
  const revenueThisMonth = Number(thisMonthPayments._sum.amount ?? 0)
  const revenueLastMonth = Number(lastMonthPayments._sum.amount ?? 0)
  const revenueChangePercent =
    revenueLastMonth === 0
      ? revenueThisMonth > 0
        ? 100
        : 0
      : Number((((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100).toFixed(2))

  return {
    totalUsers,
    newUsersThisMonth,
    totalRevenue,
    revenueThisMonth,
    revenueLastMonth,
    revenueChangePercent,
    shopRevenue,
    subscriptionRevenue,
    totalOrders,
    totalRefunds: Number(totalRefunds._sum.refundedAmount ?? 0),
    activeSubscriptions: activeSubs,
    trialingSubscriptions: trialingSubs,
    canceledSubscriptions: canceledSubs,
    mrr: Number(mrr.toFixed(2)),
  }
}

// ---------- TIME SERIES (raw SQL, 12-month buckets) ----------

type MonthRow = { month_index: number | bigint; value: string | number | Prisma.Decimal }

const fillMonths = (rows: MonthRow[], key: 'value'): MonthlyPoint[] => {
  return MONTH_NAMES.map((m, i) => {
    const found = rows.find(r => Number(r.month_index) === i + 1)
    return {
      month: m,
      monthIndex: i + 1,
      [key]: found ? Number(found.value) : 0,
    } as MonthlyPoint
  })
}

const getRevenueByMonth = async (year?: number): Promise<MonthlyPoint[]> => {
  const selectedYear = year ?? new Date().getFullYear()
  const rows = await prisma.$queryRaw<MonthRow[]>`
    SELECT
      EXTRACT(MONTH FROM "createdAt")::int AS month_index,
      COALESCE(SUM(amount), 0) AS value
    FROM payment_transactions
    WHERE status = 'SUCCEEDED'
      AND EXTRACT(YEAR FROM "createdAt") = ${selectedYear}
    GROUP BY month_index
    ORDER BY month_index;
  `
  return fillMonths(rows, 'value')
}

const getUserGrowthByMonth = async (year?: number): Promise<MonthlyPoint[]> => {
  const selectedYear = year ?? new Date().getFullYear()
  const rows = await prisma.$queryRaw<MonthRow[]>`
    SELECT
      EXTRACT(MONTH FROM "createdAt")::int AS month_index,
      COUNT(*)::int AS value
    FROM users
    WHERE EXTRACT(YEAR FROM "createdAt") = ${selectedYear}
    GROUP BY month_index
    ORDER BY month_index;
  `
  return fillMonths(rows, 'value')
}

const getSubscriptionGrowthByMonth = async (year?: number): Promise<MonthlyPoint[]> => {
  const selectedYear = year ?? new Date().getFullYear()
  const rows = await prisma.$queryRaw<MonthRow[]>`
    SELECT
      EXTRACT(MONTH FROM "startedAt")::int AS month_index,
      COUNT(*)::int AS value
    FROM user_subscriptions
    WHERE "deletedAt" IS NULL
      AND EXTRACT(YEAR FROM "startedAt") = ${selectedYear}
    GROUP BY month_index
    ORDER BY month_index;
  `
  return fillMonths(rows, 'value')
}

const getRevenueByTypeMonthly = async (year?: number): Promise<MonthlyRevenueByType[]> => {
  const selectedYear = year ?? new Date().getFullYear()
  const rows = await prisma.$queryRaw<
    { month_index: number | bigint; type: string; total: string | number | Prisma.Decimal }[]
  >`
    SELECT
      EXTRACT(MONTH FROM "createdAt")::int AS month_index,
      type,
      COALESCE(SUM(amount), 0) AS total
    FROM payment_transactions
    WHERE status = 'SUCCEEDED'
      AND EXTRACT(YEAR FROM "createdAt") = ${selectedYear}
    GROUP BY month_index, type
    ORDER BY month_index;
  `

  return MONTH_NAMES.map((m, i) => {
    const monthIdx = i + 1
    const shopRow = rows.find(r => Number(r.month_index) === monthIdx && r.type === 'SHOP')
    const subRow = rows.find(r => Number(r.month_index) === monthIdx && r.type === 'SUBSCRIPTION')
    const shop = shopRow ? Number(shopRow.total) : 0
    const subscription = subRow ? Number(subRow.total) : 0
    return {
      month: m,
      monthIndex: monthIdx,
      shop,
      subscription,
      total: shop + subscription,
    }
  })
}

// ---------- LEADERBOARD & ACTIVITY ----------

const getTopPlans = async (limit = 5): Promise<PlanLeaderboardItem[]> => {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { deletedAt: null },
    include: {
      subscriptions: {
        where: { deletedAt: null, status: { in: ['ACTIVE', 'TRIALING'] } },
        select: { id: true },
      },
    },
  })

  // Aggregate revenue per plan from successful subscription payments
  const revenueRows = await prisma.$queryRaw<{ plan_id: string; total: Prisma.Decimal }[]>`
    SELECT us."planId" AS plan_id, COALESCE(SUM(pt.amount), 0) AS total
    FROM payment_transactions pt
    INNER JOIN user_subscriptions us ON us.id = pt."subscriptionId"
    WHERE pt.status = 'SUCCEEDED' AND pt.type = 'SUBSCRIPTION'
    GROUP BY us."planId";
  `
  const revenueMap = new Map(revenueRows.map(r => [r.plan_id, Number(r.total)]))

  return plans
    .map(p => ({
      planId: p.id,
      name: p.name,
      activeSubscribers: p.subscriptions.length,
      totalRevenue: revenueMap.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.activeSubscribers - a.activeSubscribers || b.totalRevenue - a.totalRevenue)
    .slice(0, limit)
}

const getRecentActivity = async (limit = 10): Promise<RecentActivityItem[]> => {
  const [users, orders, subs, refunds] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, email: true, firstName: true, createdAt: true },
    }),
    prisma.shopOrder.findMany({
      where: { status: { in: ['PAID', 'DELIVERED', 'SHIPPED', 'PROCESSING'] } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, productName: true, customerName: true, price: true, createdAt: true },
    }),
    prisma.userSubscription.findMany({
      where: { deletedAt: null, status: { in: ['ACTIVE', 'TRIALING'] } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        plan: { select: { name: true, price: true } },
        user: { select: { email: true, firstName: true } },
      },
    }),
    prisma.subscriptionRefund.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        refundedAmount: true,
        createdAt: true,
        subscription: {
          select: { user: { select: { email: true } }, plan: { select: { name: true } } },
        },
      },
    }),
  ])

  const items: RecentActivityItem[] = [
    ...users.map(u => ({
      type: 'USER' as const,
      id: u.id,
      at: u.createdAt,
      label: `New user: ${u.firstName} (${u.email})`,
    })),
    ...orders.map(o => ({
      type: 'ORDER' as const,
      id: o.id,
      at: o.createdAt,
      label: `Order: ${o.productName} by ${o.customerName}`,
      amount: Number(o.price),
    })),
    ...subs.map(s => ({
      type: 'SUBSCRIPTION' as const,
      id: s.id,
      at: s.createdAt,
      label: `${s.user.firstName ?? s.user.email} subscribed to ${s.plan.name}`,
      amount: Number(s.plan.price),
    })),
    ...refunds.map(r => ({
      type: 'REFUND' as const,
      id: r.id,
      at: r.createdAt,
      label: `Refund: ${r.subscription.user.email} (${r.subscription.plan.name})`,
      amount: Number(r.refundedAmount),
    })),
  ]

  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit)
}

export const dashboardService = {
  getOverview,
  getRevenueByMonth,
  getUserGrowthByMonth,
  getSubscriptionGrowthByMonth,
  getRevenueByTypeMonthly,
  getTopPlans,
  getRecentActivity,
}
