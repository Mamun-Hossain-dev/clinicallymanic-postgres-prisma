import winston from 'winston'
import path from 'path'
import DailyRotateFile from 'winston-daily-rotate-file'
import config from '../config'

const { combine, timestamp, label, printf, colorize, errors, json } = winston.format

const myFormat = printf(({ level, message, label, timestamp }) => {
  const date = new Date(timestamp as string)
  const hour = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  return `${date.toDateString()} ${hour}:${minutes}:${seconds} [${label}] ${level}: ${message}`
})

const logsDir = path.join(process.cwd(), 'logs')
const isProduction = config.env === 'production'
const loggerLevel = config.logLevel ?? (isProduction ? 'info' : 'debug')

const logger = winston.createLogger({
  level: loggerLevel,
  format: combine(label({ label: 'App' }), timestamp(), errors({ stack: true })),
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? combine(label({ label: 'App' }), timestamp(), errors({ stack: true }), json())
        : combine(colorize(), myFormat),
    }),
    new DailyRotateFile({
      dirname: logsDir,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: config.logs.maxSize,
      maxFiles: config.logs.maxFiles,
    }),
    new DailyRotateFile({
      dirname: logsDir,
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: config.logs.maxSize,
      maxFiles: config.logs.maxFiles,
    }),
  ],
})

export default logger
