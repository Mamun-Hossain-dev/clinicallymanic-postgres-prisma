import { Prisma } from '@prisma/client'
import prisma from '../../lib/prisma'

const create = async (data: Prisma.BannerCreateInput) => {
  return prisma.banner.create
}
