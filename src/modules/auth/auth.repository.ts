import bcrypt from 'bcryptjs'
import config from '../../config'
import prisma from '../../lib/prisma'
import { RegisterPayloadInput } from './auth.interface'

const createUser = async (data: RegisterPayloadInput & { profileImage?: string }) => {
  const hashedPassword = await bcrypt.hash(data.password, config.bcryptSaltRounds)

  return prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      profileImage: data.profileImage,
    },
  })
}

const findByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  })
}

const findById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
  })
}

const updateUser = async (id: string, data: Record<string, unknown>) => {
  return prisma.user.update({
    where: { id },
    data,
  })
}

export const authRepository = {
  createUser,
  findByEmail,
  findById,
  updateUser,
}
