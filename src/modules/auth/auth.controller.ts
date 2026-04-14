import { Request, Response } from 'express'
import config from '../../config/index'
import catchAsync from '../../utils/catchAsync'
import sendResponse from '../../utils/sendResponse'
import { authService } from './auth.service'

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body

  const result = await authService.registerUser(payload)
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User registered successfully',
    data: result,
  })
})

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body
  const result = await authService.loginUser({ email, password })

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged in successfully',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  })
})

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies
  const result = await authService.refreshToken(refreshToken)
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Access token refreshed successfully',
    data: result,
  })
})

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body
  const result = await authService.forgotPassword(email)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'OTP sent to your email',
    data: result,
  })
})

const verifyEmail = catchAsync(async (req, res) => {
  const { email, otp } = req.body
  const result = await authService.verifyEmail(email, otp)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Email verified successfully',
    data: result,
  })
})

const resetPassword = catchAsync(async (req, res) => {
  const { email, newPassword } = req.body
  const result = await authService.resetPassword(email, newPassword)

  // Set the new refreshToken in cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: config.env === 'production',
    // sameSite: 'strict',
  })

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password reset successfully',
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  })
})

const logoutUser = catchAsync(async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged out successfully',
  })
})

const changePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body

  const result = await authService.changePassword(req.user?.id as string, oldPassword, newPassword)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password changed successfully',
    data: result,
  })
})

export const authController = {
  registerUser,
  loginUser,
  refreshToken,
  forgotPassword,
  verifyEmail,
  resetPassword,
  changePassword,
  logoutUser,
}
