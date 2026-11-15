import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { Role } from '@prisma/client';

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
