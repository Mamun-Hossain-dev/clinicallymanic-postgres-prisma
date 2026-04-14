import bcrypt from 'bcryptjs'
import { JwtPayload, Secret, SignOptions } from 'jsonwebtoken'
import config from '../../config/index'
import AppError from '../../errors/AppError'
import createOtpTemplate from '../../utils/createOtpTemplate'
import { jwtHelper } from '../../utils/jwtHelper'
import { compareOtp, hashOtp } from '../../utils/otp'
import sendMailer from '../../utils/sendMailer'
import { LoginPayloadInput, RegisterPayloadInput } from './auth.interface'
import { authRepository } from './auth.repository'

const registerUser = async (payload: RegisterPayloadInput) => {
  const existingUser = await authRepository.findByEmail(payload.email)

  if (existingUser) {
    throw new AppError(400, 'User with this email already exists')
  }

  const idx = Math.floor(Math.random() * 1000)
  const user = await authRepository.createUser({
    ...payload,
    profileImage: `https://avatar.iran.liara.run/public/${idx}.png`,
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

const loginUser = async (payload: LoginPayloadInput) => {
  const user = await authRepository.findByEmail(payload.email)
  if (!user) {
    throw new AppError(401, 'Invalid email or password')
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password)

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid email or password')
  }

  if (!user.verified) {
    throw new AppError(403, 'Please verify your email to login')
  }

  const accessToken = jwtHelper.generateToken(
    {
      userId: user.id,
      role: user.role,
      email: user.email,
    },
    config.jwt.accessSecret as Secret,
    config.jwt.accessExpiresIn as SignOptions['expiresIn']
  )

  const refreshToken = jwtHelper.generateToken(
    {
      userId: user.id,
      role: user.role,
      email: user.email,
    },
    config.jwt.refreshSecret as Secret,
    config.jwt.refreshExpiresIn as SignOptions['expiresIn']
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  }
}

const refreshToken = async (token: string) => {
  const verifiedToken = jwtHelper.verifyToken(
    token,
    config.jwt.refreshSecret as Secret
  ) as JwtPayload

  if (!verifiedToken.userId) {
    throw new AppError(401, 'Invalid refresh token')
  }

  const user = await authRepository.findById(verifiedToken.userId)
  if (!user) {
    throw new AppError(404, 'User not found')
  }

  const accessToken = jwtHelper.generateToken(
    {
      userId: user.id,
      role: user.role,
      email: user.email,
    },
    config.jwt.accessSecret as Secret,
    config.jwt.accessExpiresIn as SignOptions['expiresIn']
  )

  return {
    accessToken,
  }
}

const forgotPassword = async (email: string) => {
  const user = await authRepository.findByEmail(email)
  if (!user) {
    throw new AppError(404, 'User not found!')
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const hashedOtp = await hashOtp(otp)

  await authRepository.updateUser(user.id, {
    otp: hashedOtp,
    otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
  })

  await sendMailer(
    user.email,
    'Reset Password OTP',
    createOtpTemplate(otp, user.email, 'NodeExpressStarter')
  )
  return { message: 'OTP send to your email' }
}

const verifyEmail = async (email: string, otp: string) => {
  const user = await authRepository.findByEmail(email)

  if (!user) {
    throw new AppError(404, 'User not found!')
  }

  if (!user.otp || !user.otpExpiry) {
    throw new AppError(404, 'otp not found')
  }

  if (user.otpExpiry < new Date()) {
    throw new AppError(400, 'OTP expired')
  }

  const isOtpValid = await compareOtp(otp, user.otp)

  if (!isOtpValid) {
    throw new AppError(400, 'Invalid OTP')
  }

  await authRepository.updateUser(user.id, {
    verified: true,
    otp: null,
    otpExpiry: null,
  })

  return { message: 'Email verified successfully' }
}

const resetPassword = async (email: string, newPassword: string) => {
  const user = await authRepository.findByEmail(email)
  if (!user) throw new AppError(404, 'User not found')

  const hashedPassword = await bcrypt.hash(newPassword, config.bcryptSaltRounds)

  await authRepository.updateUser(user.id, {
    password: hashedPassword,
    otp: null,
    otpExpiry: null,
  })

  // Auto-login after reset
  const accessToken = jwtHelper.generateToken(
    { userId: user.id, role: user.role, email: user.email },
    config.jwt.accessSecret as Secret,
    config.jwt.accessExpiresIn as SignOptions['expiresIn']
  )

  const newRefreshToken = jwtHelper.generateToken(
    { userId: user.id, role: user.role, email: user.email },
    config.jwt.refreshSecret as Secret,
    config.jwt.refreshExpiresIn as SignOptions['expiresIn']
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithOutPassword } = user
  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: userWithOutPassword,
  }
}

const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
  const user = await authRepository.findById(userId)

  if (!user) throw new AppError(404, 'user not found')
  const isPasswordMatched = await bcrypt.compare(oldPassword, user.password)
  if (!isPasswordMatched) throw new AppError(400, 'Password not matched')

  const hashedPassword = await bcrypt.hash(newPassword, config.bcryptSaltRounds)
  await authRepository.updateUser(userId, { password: hashedPassword })

  return { message: 'Password changed successfully' }
}

export const authService = {
  registerUser,
  loginUser,
  refreshToken,
  forgotPassword,
  verifyEmail,
  resetPassword,
  changePassword,
}
