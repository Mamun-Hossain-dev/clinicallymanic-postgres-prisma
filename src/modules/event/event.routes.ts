import express from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { fileUploader } from '../../utils/fileUpload'
import { userRole } from '../user/user.constants'
import { eventController } from './event.controller'
import {
  createEventZodSchema,
  getAllEventQueryZodSchema,
  getEventParamZodSchema,
  updateEventZodSchema,
} from './event.validation'

const router = express.Router()

// Create event with thumbnail (admin only)
router.post(
  '/',
  auth(userRole.admin),
  fileUploader.upload.single('thumbnail'),
  validateRequest(createEventZodSchema),
  eventController.createEvent
)

// Get all events (public)
router.get('/', validateRequest(getAllEventQueryZodSchema), eventController.getAllEvents)

// Get single event (public)
router.get('/:id', validateRequest(getEventParamZodSchema), eventController.getEventById)

// Update event with thumbnail (admin only)
router.patch(
  '/:id',
  auth(userRole.admin),
  fileUploader.upload.single('thumbnail'),
  validateRequest(getEventParamZodSchema),
  validateRequest(updateEventZodSchema),
  eventController.updateEventById
)

// Delete event (admin only)
router.delete(
  '/:id',
  auth(userRole.admin),
  validateRequest(getEventParamZodSchema),
  eventController.deleteEventById
)

export const eventRoutes = router
