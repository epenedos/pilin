import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthRequest } from '../types';
import { UnauthorizedError } from '../utils/errors';

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing token');
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.accessTokenSecret) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token expired', 'TOKEN_EXPIRED');
    }
    throw new UnauthorizedError('Invalid token');
  }
}
