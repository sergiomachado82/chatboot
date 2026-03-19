import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || undefined,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  ...(!env.SMTP_HOST && { service: 'gmail' }),
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

interface ContactFormData {
  nombre: string;
  email: string;
  telefono: string;
  complejo?: string;
  huespedes?: string;
  fechaIngreso?: string;
  fechaSalida?: string;
  mensaje?: string;
}

export async function sendContactEmail(data: ContactFormData): Promise<void> {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    logger.error('SMTP credentials not configured');
    throw new Error('Email service not configured');
  }

  const { nombre, email, telefono, complejo, huespedes, fechaIngreso, fechaSalida, mensaje } = data;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f9fafb; border-radius: 12px;">
      <h2 style="color: #1e40af; margin-bottom: 20px;">Nueva consulta de disponibilidad</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Nombre</td>
          <td style="padding: 8px 12px; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${nombre}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Email</td>
          <td style="padding: 8px 12px; color: #1f2937; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Telefono</td>
          <td style="padding: 8px 12px; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${telefono}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Complejo</td>
          <td style="padding: 8px 12px; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${complejo || 'No especificado'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Huespedes</td>
          <td style="padding: 8px 12px; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${huespedes || '-'}</td>
        </tr>
        ${fechaIngreso ? `<tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Fecha ingreso</td>
          <td style="padding: 8px 12px; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${fechaIngreso}</td>
        </tr>` : ''}
        ${fechaSalida ? `<tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Fecha salida</td>
          <td style="padding: 8px 12px; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${fechaSalida}</td>
        </tr>` : ''}
      </table>
      ${mensaje ? `
      <div style="margin-top: 20px; padding: 16px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
        <p style="font-weight: bold; color: #374151; margin: 0 0 8px 0;">Mensaje:</p>
        <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">${mensaje}</p>
      </div>` : ''}
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
        Enviado desde el formulario de contacto de lasgrutasdepartamentos.com
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Las Grutas Departamentos" <${env.SMTP_USER}>`,
    to: 'info@lasgrutasdepartamentos.com',
    replyTo: email,
    subject: `Consulta de disponibilidad - ${nombre}${complejo ? ` - ${complejo}` : ''}`,
    html,
  });

  logger.info({ nombre, email }, 'Contact form email sent');
}
