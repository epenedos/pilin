import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { env } from '../config/env';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth',
  maxAge: env.refreshTokenExpiryMs,
};

export const authController = {
  async register(req: Request, res: Response) {
    const { email, password, displayName } = req.body;
    const result = await authService.register(email, password, displayName);

    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
    res.status(201).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  },

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ error: 'No refresh token' });
      return;
    }

    const result = await authService.refresh(token);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken: result.accessToken });
  },

  async logout(req: Request, res: Response) {
    const token = req.cookies?.refreshToken;
    if (token) {
      await authService.logout(token);
    }
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.status(204).send();
  },
};
