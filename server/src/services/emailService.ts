import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export async function sendResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    logger.error('SMTP_USER and SMTP_PASS must be configured to send emails');
    throw new Error('Email service not configured');
  }

  await transporter.sendMail({
    from: `"Panel de Agentes" <${env.SMTP_USER}>`,
    to,
    subject: 'Recuperar contraseña - Panel de Agentes',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e40af;">Recuperar contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña del Panel de Agentes.</p>
        <p>Hacé clic en el siguiente botón para crear una nueva contraseña:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
          Restablecer contraseña
        </a>
        <p style="color: #6b7280; font-size: 14px;">Este enlace expira en 1 hora.</p>
        <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este email.</p>
      </div>
    `,
  });

  logger.info({ to }, 'Reset password email sent');
}
