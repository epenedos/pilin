import { Request, Response, NextFunction } from 'express';

const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const entry = windows.get(key);

    if (!entry || now > entry.resetAt) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    entry.count++;
    if (entry.count > maxRequests) {
      res.status(429).json({ error: 'Too many requests, try again later' });
      return;
    }

    next();
  };
}
