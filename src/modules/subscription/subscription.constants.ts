export const billingIntervalValues = ['MONTHLY', 'YEARLY', 'WEEKLY'] as const

export const subscriptionStatusValues = [
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'EXPIRED',
  'REFUNDED',
  'INCOMPLETE',
] as const

export const refundStatusValues = ['PENDING', 'SUCCEEDED', 'FAILED'] as const

export const planFeatureValues = [
  'PREMIUM_CONTENT',
  'AI_CHAT_ACCESS',
  'UNLIMITED_EVENTS',
  'PRIORITY_SUPPORT',
  'ADVANCED_ANALYTICS',
  'CUSTOM_BRANDING',
  'EXPORT_DATA',
] as const

export const SUBSCRIPTION_CONFIG = {
  REFUND_WINDOW_DAYS: 15,
  REFUND_PERCENTAGE: 0.5,
  DEFAULT_TRIAL_DAYS: 7,
  SOFT_DELETE_AFTER_DAYS: 30,
} as const

export const ACTIVE_STATUSES = ['TRIALING', 'ACTIVE'] as const
