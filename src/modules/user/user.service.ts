import { Prisma } from '@prisma/client'
import AppError from '../../errors/AppError'
import { fileUploader } from '../../utils/fileUpload'
import pagination from '../../utils/pagination'
import { UserFilterOptions, UserPaginationOptions } from './user.interface'
import { userRepository } from './user.repository'

const createUser = async (payload: Prisma.UserCreateInput) => {
  return userRepository.create(payload)
}

const getUserById = async (id: string) => {
  const user = await userRepository.findById(id)
  if (!user) {
    throw new AppError(404, 'User not found')
  }
  return user
}

const getAllUsers = async (
  filterOptions: UserFilterOptions,
  paginationOptions: UserPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterOptions
  const { page, limit, skip, sortBy, sortOrder } = pagination(paginationOptions)

  const andConditions: Prisma.UserWhereInput[] = []
  const searchFields = ['firstName', 'lastName', 'email']

  if (searchTerm) {
    andConditions.push({
      OR: searchFields.map(field => ({
        [field]: { contains: searchTerm, mode: 'insensitive' as Prisma.QueryMode },
      })),
    })
  }

  if (Object.keys(filterData).length) {
    andConditions.push({
      AND: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    })
  }

  const whereCondition: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {}

  const orderBy: Prisma.UserOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  const [users, total] = await Promise.all([
    userRepository.findMany({
      where: whereCondition,
      orderBy,
      skip,
      take: limit,
    }),
    userRepository.count(whereCondition),
  ])



  const totalPages = Math.ceil(total / limit)

  return {
    data: users,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  }
}

const updateUserById = async (
  id: string,
  updateData: Prisma.UserUpdateInput,
  file?: Express.Multer.File
) => {
  const existingUser = await userRepository.findById(id)
  if (!existingUser) {
    throw new AppError(404, 'User not found')
  }

  if (file) {
    const uploadedImage = await fileUploader.uploadToCloudinary(file)

    if (!uploadedImage?.url) {
      throw new AppError(500, 'Image upload failed')
    }

    updateData.profileImage = uploadedImage.url
    updateData.profileImagePublicId = uploadedImage.publicId

    // Delete old image from Cloudinary
    if (existingUser.profileImagePublicId) {
      await fileUploader.deleteFromCloudinary(existingUser.profileImagePublicId)
    }
  }

  return userRepository.update(id, updateData)
}

const deleteUserById = async (id: string) => {
  const user = await userRepository.findById(id)
  if (!user) {
    throw new AppError(404, 'User not found')
  }
  return userRepository.remove(id)
}

export const userService = {
  createUser,
  getUserById,
  getAllUsers,
  updateUserById,
  deleteUserById,
}
