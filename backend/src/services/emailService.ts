import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  transporter = env.SMTP_HOST
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined
      })
    : null;
  return transporter;
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Sends an email. With no SMTP configured it logs the message instead (development),
 * outside production only, so reset links never end up in production logs.
 */
export async function sendMail(msg: MailMessage): Promise<void> {
  const t = getTransporter();
  if (!t) {
    if (env.NODE_ENV !== 'production') {
      logger.info(`[email:not-sent] SMTP_HOST is not set. To: ${msg.to} | ${msg.subject}\n${msg.text}`);
    } else {
      logger.warn(`Email to ${msg.to} not sent: SMTP_HOST is not configured`);
    }
    return;
  }
  await t.sendMail({ from: env.SMTP_FROM, ...msg });
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export async function sendPasswordResetEmail(to: string, name: string, link: string): Promise<void> {
  const minutes = env.RESET_TOKEN_TTL_MINUTES;
  await sendMail({
    to,
    subject: 'Reset your AuctionLens password',
    text: `Hi ${name},\n\nUse this link to choose a new password (valid for ${minutes} minutes):\n${link}\n\nIf you did not ask for this, you can ignore this email. Your password will not change.`,
    html: `<p>Hi ${escapeHtml(name)},</p><p>Use the button below to choose a new password. The link is valid for ${minutes} minutes.</p><p><a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 18px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a></p><p>If you did not ask for this, you can ignore this email. Your password will not change.</p>`
  });
}
