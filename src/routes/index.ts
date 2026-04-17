import express from 'express'
import { authRoutes } from '../modules/auth/auth.routes'
import { bannerRoutes } from '../modules/banner/banner.routes'
import { contactRoutes } from '../modules/contact/contact.routes'
import { contentRoutes } from '../modules/content/content.routes'
import { eventRoutes } from '../modules/event/event.routes'
import { newsletterRoutes } from '../modules/newsletter/newsletter.routes'
import { offerRoutes } from '../modules/offer/offer.routes'
import { userRoutes } from '../modules/user/user.routes'

const router = express.Router()

const moduleRoutes = [
  {
    path: '/users',
    route: userRoutes,
  },
  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: '/banners',
    route: bannerRoutes,
  },
  {
    path: '/contacts',
    route: contactRoutes,
  },
  {
    path: '/offers',
    route: offerRoutes,
  },
  {
    path: '/events',
    route: eventRoutes,
  },
  {
    path: '/newsletters',
    route: newsletterRoutes,
  },
  {
    path: '/contents',
    route: contentRoutes,
  },
]

moduleRoutes.forEach(route => router.use(route.path, route.route))

export default router
