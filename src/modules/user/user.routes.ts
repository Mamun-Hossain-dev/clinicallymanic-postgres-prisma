import express from 'express'
import validateRequest from '../../middlewares/validateRequest'
import { userController } from './user.controller'
import {
  createUserZodSchema,
  getAllUsersZodSchema,
  getUserParamZodSchema,
  updateUserZodSchema,
} from './user.validation'

const router = express.Router()

router.post('/', validateRequest(createUserZodSchema), userController.createUser)

router.get('/:id', validateRequest(getUserParamZodSchema), userController.getUserById)

router.get('/', validateRequest(getAllUsersZodSchema), userController.getAllUsers)

router.patch(
  '/:id',
  validateRequest(getUserParamZodSchema),
  validateRequest(updateUserZodSchema),
  userController.updateUserById
)

router.delete('/:id', validateRequest(getUserParamZodSchema), userController.deleteUserById)

export const userRoutes = router
