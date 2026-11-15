import { Request, Response, NextFunction } from 'express';
import { CookieOptions } from 'express';
import { authService } from '../services/authService';
import { env } from '../config/env';

const REFRESH_COOKIE = 'refreshToken';
const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export class AuthController {
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);

      // Set HTTP-only refresh token cookie
      res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);

      res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token: string | undefined = req.cookies?.[REFRESH_COOKIE];
      const result = await authService.refreshToken(token);

      res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public async logout(req: Request, res: Response): Promise<void> {
    await authService.revokeRefreshToken(req.cookies?.[REFRESH_COOKIE]);
    const { maxAge: _maxAge, ...clearOptions } = refreshCookieOptions;
    res.clearCookie(REFRESH_COOKIE, clearOptions);
    // Also clear any cookie set by older builds at the default path.
    res.clearCookie(REFRESH_COOKIE);
    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  }

  public async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }
      const user = await authService.getCurrentUser(req.user.id);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
