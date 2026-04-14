import winston from 'winston'
import path from 'path'

const { combine, timestamp, label, printf, colorize } = winston.format

const myFormat = printf(({ level, message, label, timestamp }) => {
  const date = new Date(timestamp as string)
  const hour = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  return `${date.toDateString()} ${hour}:${minutes}:${seconds} [${label}] ${level}: ${message}`
})

const logger = winston.createLogger({
  level: 'info',
  format: combine(label({ label: 'App' }), timestamp(), myFormat),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), myFormat),
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'success.log'),
      level: 'info',
    }),
  ],
})

export default logger
