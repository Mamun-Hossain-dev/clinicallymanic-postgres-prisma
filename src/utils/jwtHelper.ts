import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken'
import AppError from '../errors/AppError'

type ExpiresIn = SignOptions['expiresIn']

const generateToken = (
  payload: string | object | Buffer,
  secretKey: Secret,
  expiresIn: ExpiresIn
) => {
  const options: SignOptions = {
    expiresIn,
    algorithm: 'HS256',
  }

  return jwt.sign(payload, secretKey, options)
}

const verifyToken = (token: string, secretKey: Secret): JwtPayload => {
  try {
    const decoded = jwt.verify(token, secretKey)
    return decoded as JwtPayload
  } catch {
    throw new AppError(401, 'Unauthorized: Invalid or expired token')
  }
}

export const jwtHelper = {
  generateToken,
  verifyToken,
}
