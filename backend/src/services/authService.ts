import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { Role } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { sendPasswordResetEmail } from './emailService';

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

export class AuthService {
  public async register(data: { name: string; email: string; password: string }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (existing) {
      throw new AppError('An account with this email address already exists', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        role: Role.USER
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true, tokenVersion: true }
    });

    const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, tv: user.tokenVersion });
    const { tokenVersion: _tv, ...publicUser } = user;

    return { user: publicUser, accessToken, refreshToken };
  }

  public async login(data: { email: string; password: string }) {

    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (!user) {
      throw new AppError('Invalid email or password credentials', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password credentials', 401, 'INVALID_CREDENTIALS');
    }

    const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, tv: user.tokenVersion });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      accessToken,
      refreshToken
    };
  }

  public async refreshToken(token: string | undefined) {
    try {
      if (!token) throw new Error('missing');
      const decoded = verifyRefreshToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true, role: true, tokenVersion: true }
      });

      // Reject tokens issued before the last logout (or minted before versioning existed).
      if (!user || decoded.tv !== user.tokenVersion) {
        throw new Error('revoked');
      }

      const newAccessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
      const newRefreshToken = signRefreshToken({ userId: user.id, tv: user.tokenVersion });
      const { tokenVersion: _tv, ...publicUser } = user;

      return { user: publicUser, accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
  }

  /**
   * Revokes all refresh tokens for the user that owns `token` (if it is valid).
   * Invalid/expired tokens are ignored so logout always succeeds for the client.
   */
  public async revokeRefreshToken(token: string | undefined): Promise<void> {
    if (!token) return;
    try {
      const decoded = verifyRefreshToken(token);
      await prisma.user.updateMany({
        where: { id: decoded.userId, tokenVersion: decoded.tv },
        data: { tokenVersion: { increment: 1 } }
      });
    } catch {
      // ignore
    }
  }

  /**
   * Starts a password reset. Always resolves quietly so callers cannot tell whether an
   * account exists for the address.
   */
  public async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return;

    const token = randomBytes(32).toString('hex');
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: sha256(token),
          expiresAt: new Date(Date.now() + env.RESET_TOKEN_TTL_MINUTES * 60 * 1000)
        }
      })
    ]);

    const link = `${env.FRONTEND_URL.replace(/\/$/, '')}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail(user.email, user.name, link);
    } catch (err) {
      // Never surface delivery problems: that would reveal which addresses are registered.
      logger.error(`Password reset email failed: ${(err as Error).message}`);
    }
  }

  /** Sets a new password from an emailed token (single use) and signs out every session. */
  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new AppError('This reset link is invalid or has expired. Please request a new one.', 400, 'INVALID_RESET_TOKEN');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    // Claim the token atomically so two simultaneous requests cannot both succeed.
    const claimed = await prisma.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() }
    });
    if (claimed.count === 0) {
      throw new AppError('This reset link is invalid or has expired. Please request a new one.', 400, 'INVALID_RESET_TOKEN');
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash, tokenVersion: { increment: 1 } } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, id: { not: record.id } } })
    ]);
  }

  public async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            savedAuctions: true,
            alerts: true,
            notifications: { where: { read: false } }
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  }
}

export const authService = new AuthService();
