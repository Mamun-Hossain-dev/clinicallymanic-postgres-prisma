import { Request, Response } from 'express'
import pick from '../../utils/pick'
import catchAsync from '../../utils/catchAsync'
import sendResponse from '../../utils/sendResponse'
import { userService } from './user.service'

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createUser(req.body)
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User created successfully',
    data: result,
  })
})

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await userService.getUserById(id)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  })
})

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filterOptions = pick(req.query, ['searchTerm', 'firstName', 'lastName', 'email', 'role'])

  const paginationOptions = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder'])

  const result = await userService.getAllUsers(filterOptions, paginationOptions)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const updateUserById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const imageFile = req.file
  const updateData = req.body.data ? JSON.parse(req.body.data) : req.body

  const result = await userService.updateUserById(id, updateData, imageFile as Express.Multer.File)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User updated successfully',
    data: result,
  })
})

const deleteUserById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string

  const result = await userService.deleteUserById(id)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User deleted successfully',
    data: result,
  })
})

export const userController = {
  createUser,
  getUserById,
  getAllUsers,
  deleteUserById,
  updateUserById,
}
