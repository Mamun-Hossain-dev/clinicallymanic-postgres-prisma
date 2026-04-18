import logger from '../utils/logger'
import { startSubscriptionCron } from './subscription.cron'

export const startCronJobs = () => {
  startSubscriptionCron()
  logger.info('Cron jobs initialized')
}
