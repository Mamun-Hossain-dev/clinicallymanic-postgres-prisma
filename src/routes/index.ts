import express from 'express'
import { authRoutes } from '../modules/auth/auth.routes'
import { userRoutes } from '../modules/user/user.routes'
import { bannerRoutes } from '../modules/banner/banner.routes'

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
]

moduleRoutes.forEach(route => router.use(route.path, route.route))

export default router
