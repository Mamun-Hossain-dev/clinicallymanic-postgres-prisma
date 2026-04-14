import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'
import path from 'node:path'
import streamifier from 'streamifier'
import config from '../config'
import AppError from '../errors/AppError'

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
})

const sanitizeFileName = (fileName: string) => {
  return fileName
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase()
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv|csv/
    const ext = path.extname(file.originalname).toLowerCase()

    if (!allowedTypes.test(ext)) {
      return cb(new AppError(400, 'Only images, videos, or CSV files are allowed'))
    }

    cb(null, true)
  },
})

const uploadToCloudinary = (
  file: Express.Multer.File
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new AppError(400, 'No file provided for upload'))
    }

    const ext = path.extname(file.originalname).toLowerCase()
    const isVideo = ['.mp4', '.mov', '.avi', '.mkv'].includes(ext)
    const isCSV = ext === '.csv'
    const safeFileName = `${Date.now()}-${sanitizeFileName(file.originalname)}`

    let resourceType: 'image' | 'video' | 'raw' = 'image'
    if (isVideo) resourceType = 'video'
    else if (isCSV) resourceType = 'raw'

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `NodeExpressStarter/${resourceType}s`,
        resource_type: resourceType,
        public_id: safeFileName,
        ...(isVideo || isCSV
          ? {}
          : {
              transformation: {
                width: 500,
                height: 500,
                crop: 'limit',
              },
            }),
      },
      (error, result) => {
        if (error || !result) {
          return reject(new AppError(500, 'Cloudinary upload failed'))
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        })
      }
    )

    streamifier.createReadStream(file.buffer).pipe(stream)
  })
}

const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> => {
  if (!publicId) return

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch {
    throw new AppError(500, 'Failed to delete file from Cloudinary')
  }
}

export const fileUploader = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
}
