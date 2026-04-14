import bcrypt from 'bcryptjs'
import config from '../config'

export const hashOtp = async (otp: string) => {
  return await bcrypt.hash(otp, config.bcryptSaltRounds)
}

export const compareOtp = async (otp: string, hashedOtp: string) => {
  return await bcrypt.compare(otp, hashedOtp)
}
