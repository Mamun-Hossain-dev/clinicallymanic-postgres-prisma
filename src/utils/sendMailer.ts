import nodemailer from 'nodemailer'
import config from '../config'
import AppError from '../errors/AppError'

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: Number(config.email.port),
  secure: Number(config.email.port) === 465, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
})

const sendMailer = async (email: string, subject?: string, html?: string) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const info = await transporter.sendMail({
      from: config.email.from,
      to: email,
      subject,
      html,
    })
  } catch (err) {
    throw new AppError(500, 'Failed to send email!', err instanceof Error ? err.message : '')
  }
}

export default sendMailer
